import React from 'react';
import { GpxInfo, LatLonEle } from '../types';

import {
    bearingDiff,
    clamp,
    findBounds,
    findCenter,
    fixBearingDomain,
    geoJsonToPoint,
    pointsToGeoJsonFeature,
    toGeoJson,
    toGeoJsonFeature,
    toGeoJsonLineString,
} from '../mapTools';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';

import '../../static/map.css';
import { HeightGraphComponent } from './HeightGraphComponent';
import { MapComponentProgress } from './MapComponentProgress';
import { MapComponentOptions } from './MapComponentOptions';

type Props = {
    gpxInfo: GpxInfo;
    // We bind f to full screen, space to play/pause, h to hide controls if enabled
    bindKeys: boolean;
    // Whether or not to show the elevation profile
    showElevationProfile: boolean;
    mapboxAccessToken: string;
    // Maximum number of times per second to update the position
    // Note that if positionUpdateFunctionRef is set, this is ignored!
    playbackFPS: number;
    // If positionUpdateFunctionRef is set, then the default playback controls will be disabled.
    // Position is a number in the range [0, # points - 1], deltaS is number in seconds since last update
    positionUpdateFunctionRef?: React.MutableRefObject<
        (position: number, deltaS: number) => void
    >;
    // If set, this overrides the default initial state
    initialState?: Partial<State>;
    // If true, don't show the customization options
    disableOptions?: boolean;
};

export type State = {
    useFollowCam: boolean;
    followSensitivity: number;
    followMomentum: number;
    useFollowTrack: boolean;
    mapStyle: string;
    showTopo: boolean;
    // pointsPerSecond is a fixed value that means the number of points each frame
    // should advance so the entire route takes 1 minute to finish. Can be a fractional.
    pointsPerSecond: number;
    // are we currently playing?
    isPlaying: boolean;
    // multiply pointsPerSecond by playbackRate to decide how much to animate per second
    playbackRate: number;
    gpxTrackWidth: number;
    gpxTrackColor: string;
    pointIcon: string;
    pointIconSize: number;
    // This value controls the size of the rolling window over which we find the camera momentum
    // In follow cam, new momentum vector = avg(last len(rolling avg window) camera vectors)
    // Higher values smooth out the movement more, lower makes it more reactive
    // Beware that setting it too low may cause camera to overshoot and oscillate
    camMomentumRollingAvgInterval: number;
};

export type SetStateFunc = MapComponent['setState'];

export default class MapComponent extends React.Component<Props, State> {
    mapDivRef = React.createRef<HTMLDivElement>();
    progressRef = React.createRef<HTMLProgressElement>();
    // A very messy approach: the child heightgraph component gives us this function to put the heightgraph at a new position
    applyPositionUpdateToHeightGraph: (position: number) => void;

    map: mapboxgl.Map;
    mapControl = new mapboxgl.NavigationControl({ visualizePitch: true });
    fullscreenControl = new mapboxgl.FullscreenControl();
    // where is the bike along the track? can be fractional, in the range [0, # points]
    // TODO: can i put this number in the state?
    playhead: number = 0;
    lastAnimationTime: number | null = null;

    lastFollowcamMoveVector: {
        // Momemtum movement vector of the camera, scaled to playback rate of 1.
        momentumVec: [number, number] | null;
        lastCenter: turf.Position | null;
        // Last movement vectors of the camera, scaled to playback rate of 1.
        // Length <= LAST_VECTOR_ROLLING_AVG_INTERVAL
        lastVecs: [number, number][];
    };

    animationHandle: number;
    point = {
        type: 'FeatureCollection' as const,
        features: [
            {
                type: 'Feature' as const,
                properties: {} as { [key: string]: unknown },
                geometry: {
                    type: 'Point' as const,
                    coordinates: [0, 0],
                },
            },
        ],
    };

    constructor(props: Props) {
        super(props);
        this.state = {
            camMomentumRollingAvgInterval: Math.round(this.props.playbackFPS * 2),
            useFollowCam: false,
            followSensitivity: 45,
            followMomentum: 0,
            useFollowTrack: false,
            mapStyle: 'mapbox://styles/mapbox/outdoors-v11',
            showTopo: false,
            // divide by 60 seconds per minute
            pointsPerSecond: props.gpxInfo.points.length / 60,
            isPlaying: false,
            playbackRate: 1,
            gpxTrackWidth: 4,
            gpxTrackColor: '#ffff00',
            pointIcon: 'bicycle-15',
            pointIconSize: 2,
        };
        if (props.initialState) {
            this.state = { ...this.state, ...props.initialState };
        }
        const origin = toGeoJson(props.gpxInfo.points[0]);
        this.point.features[0].geometry.coordinates = origin;
        this.resetFollowCamMomemtum();
    }

    /**
     * The main animation loop, checks if we are in playing state and then calls animationBody
     * once the time since last animation exceeds minAnimationTime.
     * On the first frame of playback we do not actually run the animation body,
     * but instead we only store the time.
     * That's because the camera animation expects a duration and we do not know in
     * advance what the frame timing is.
     * @param t timestamp
     */
    animationLoop = (t: number) => {
        if (!this.state.isPlaying) {
            this.animationHandle = requestAnimationFrame(this.animationLoop);
            this.lastAnimationTime = null;
            return;
        } else if (this.lastAnimationTime == null) {
            this.animationHandle = requestAnimationFrame(this.animationLoop);
            this.lastAnimationTime = t;
            return;
        }
        // cap at given fps
        const minAnimationTime = 1000 / this.props.playbackFPS;
        if (t - this.lastAnimationTime > minAnimationTime) {
            this.animationBody(t - this.lastAnimationTime);
            this.lastAnimationTime = t;
        }
        this.animationHandle = requestAnimationFrame(this.animationLoop);
    };

    /**
     * Runs the animation by computing a new position based on the playback rate and
     * updating the point to that position.
     * @param timeDeltaMs time since last animation frame in milliseconds
     */
    animationBody(timeDeltaMs: number): void {
        // Note: times are in milliseconds.
        const timeDeltaS = timeDeltaMs / 1000;
        // Compute how many points to advance the playhead based on the time difference and playback rate
        const moveDelta =
            timeDeltaS * this.state.playbackRate * this.state.pointsPerSecond;
        const { points } = this.props.gpxInfo;
        const newPosition = Math.min(moveDelta + this.playhead, points.length - 1);
        this.updatePointPosition(newPosition, timeDeltaS);

        // We've reached the end, pause the playback indicator
        if (newPosition === points.length - 1) {
            this.setState({ isPlaying: false });
        }
    }

    /**
     * Compute an in-between coordinate between two points on the gpx track.
     * @param position possibly fractional position in the range [0, points.length - 1)
     * @returns an object {point: Feature, bearing: number}
     * Note: the end range is not inclusive! position must be strictly less than points.length - 1
     */
    interpolatePoint(position: number) {
        const { points } = this.props.gpxInfo;
        const pointIndex = Math.floor(position);
        const currentFrameFeature = toGeoJsonFeature(points[pointIndex]);
        const nextFrameFeature = toGeoJsonFeature(points[pointIndex + 1]);
        const nextDist = turf.distance(currentFrameFeature, nextFrameFeature);
        const bearing = turf.bearing(currentFrameFeature, nextFrameFeature);
        return {
            point: turf.along(
                toGeoJsonLineString(points[pointIndex], points[pointIndex + 1]),
                nextDist * (position - pointIndex)
            ),
            bearing,
        };
    }

    resetFollowCamMomemtum() {
        this.lastFollowcamMoveVector = {
            momentumVec: null,
            lastCenter: null,
            lastVecs: [],
        };
    }

    /**
     * Find new map position parameters based on followcam settings
     * @param timeDeltaS time since the last frame
     * @param pointPos the lng/lat position of the point
     * @returns parameters {center: Position, fixedBearing: number} for map view update
     */
    updateFollowCamParameters(timeDeltaS: number, pointPos: turf.Position) {
        let newCenter = pointPos;
        const { momentumVec, lastCenter, lastVecs } = this.lastFollowcamMoveVector;
        const { playbackRate } = this.state;
        // To allow the momentum feature to work when we receive position updates from outside,
        // assume that we are playing if we have a position update function.
        // Then the momentum reset is handled by the 2 second heuristic.
        const isPlaying =
            this.state.isPlaying || this.props.positionUpdateFunctionRef != null;
        if (isPlaying && momentumVec == null && lastCenter != null) {
            // We are playing but we have not recorded a last camera move (so this is first frame)
            this.lastFollowcamMoveVector.momentumVec = [
                (pointPos[0] - lastCenter[0]) / playbackRate,
                (pointPos[1] - lastCenter[1]) / playbackRate,
            ];
        } else if (isPlaying && momentumVec != null && lastCenter != null) {
            // We are playing and we know a last movement vector
            const baseMoveVector = [
                pointPos[0] - lastCenter[0],
                pointPos[1] - lastCenter[1],
            ];
            // Take the weighted sum between baseMoveVector and lastFollowcamMoveVector
            const newMoveVector = [
                (1 - this.state.followMomentum) * baseMoveVector[0] +
                    this.state.followMomentum * momentumVec[0] * playbackRate,
                (1 - this.state.followMomentum) * baseMoveVector[1] +
                    this.state.followMomentum * momentumVec[1] * playbackRate,
            ];
            // Add the newMoveVector to the last center to get the new center
            newCenter = [
                lastCenter[0] + newMoveVector[0],
                lastCenter[1] + newMoveVector[1],
            ];
            // Record this camera movement in the history
            lastVecs.push([
                newMoveVector[0] / playbackRate,
                newMoveVector[1] / playbackRate,
            ]);
            // If we exceed our rolling average threshold, remove the first one and update the momentum vector
            if (lastVecs.length > this.state.camMomentumRollingAvgInterval) {
                lastVecs.shift();
                const sum = lastVecs.reduce(
                    (acc, cur) => [acc[0] + cur[0], acc[1] + cur[1]],
                    [0, 0]
                );
                this.lastFollowcamMoveVector.momentumVec = [
                    sum[0] / this.state.camMomentumRollingAvgInterval,
                    sum[1] / this.state.camMomentumRollingAvgInterval,
                ];
            }
        }
        let cameraBearing = this.map.getBearing();
        if (lastCenter) {
            cameraBearing = turf.bearing(lastCenter, newCenter);
            const rot = bearingDiff(this.map.getBearing(), cameraBearing);
            // Cap the camera rotation rate at specified degrees/second to prevent dizziness
            // After adding the rotation, reset domain to [-180, 180]
            // because moving from +170 to -170 is +20, which goes to 190, and out of bounds.
            const changeCap = this.state.followSensitivity * timeDeltaS;
            cameraBearing = fixBearingDomain(
                this.map.getBearing() + clamp(rot, -changeCap, changeCap)
            );
        }
        this.lastFollowcamMoveVector.lastCenter = newCenter;
        return { cameraBearing, center: newCenter };
    }

    /**
     * Update the point's position on the map, and possibly animate the camera to follow.
     * Also updates the progress bar and track display if on FollowTrack
     * @param newPosition index into the gpx track, can be fractional
     * @param timeDeltaS how long the camera move should take, in seconds
     */
    updatePointPosition(newPosition: number, timeDeltaS: number) {
        this.playhead = newPosition;
        const { points } = this.props.gpxInfo;
        const pointIndex = Math.floor(newPosition);
        if (pointIndex >= points.length - 1) {
            this.point.features[0] = toGeoJsonFeature(points[pointIndex]);
            return;
        }

        const { point, bearing } = this.interpolatePoint(newPosition);

        // @ts-ignore it's okay this is fine
        this.point.features[0] = point;
        this.point.features[0].properties.bearing = bearing;
        (this.map.getSource('point') as mapboxgl.GeoJSONSource).setData(this.point);

        // Update progress bar percentage and elevation profile graph based on this position
        if (this.progressRef.current != null) {
            this.progressRef.current.value = (100 * newPosition) / (points.length - 1);
        }
        if (this.applyPositionUpdateToHeightGraph != null) {
            this.applyPositionUpdateToHeightGraph(newPosition);
        }

        if (this.state.useFollowCam) {
            const { center, cameraBearing } = this.updateFollowCamParameters(
                timeDeltaS,
                point.geometry.coordinates
            );
            this.map.easeTo({
                // @ts-ignore this is fine
                center,
                bearing: cameraBearing,
                duration: timeDeltaS * 1000,
                // Linear move speed
                easing: (x) => x,
            });
        }
        if (this.state.useFollowTrack) {
            this.updateTrackDisplay(newPosition);
        }
    }

    /**
     * Update the gps track, pass in `points.length - 1` to show the entire track.
     * @param position index into the gpx track, can be fractional
     */
    updateTrackDisplay(position: number) {
        const pointIndex = Math.floor(position);
        const { points } = this.props.gpxInfo;
        if (pointIndex === points.length - 1) {
            const source = this.map.getSource('gpxTrack') as mapboxgl.GeoJSONSource;
            source.setData(pointsToGeoJsonFeature(points).data);
        } else {
            const sliceToPlayhead = points.slice(0, pointIndex + 1);
            sliceToPlayhead.push(geoJsonToPoint(this.interpolatePoint(position).point));
            const source = this.map.getSource('gpxTrack') as mapboxgl.GeoJSONSource;
            source.setData(pointsToGeoJsonFeature(sliceToPlayhead).data);
        }
    }

    windowKeyBinds = (e: KeyboardEvent) => {
        if (e.code === 'Space') {
            e.preventDefault();
            e.stopPropagation();
            this.handlePlayClick();
        }
        if (e.code === 'KeyF') {
            e.preventDefault();
            e.stopPropagation();
            if (document.fullscreenElement == null) {
                if (this.mapDivRef.current != null) {
                    this.mapDivRef.current.requestFullscreen();
                }
            } else {
                document.exitFullscreen();
            }
        }
        if (e.code === 'KeyH') {
            e.preventDefault();
            e.stopPropagation();
            if (this.map.hasControl(this.mapControl)) {
                this.map.removeControl(this.mapControl);
                this.map.removeControl(this.fullscreenControl);
            } else {
                this.map.addControl(this.mapControl);
                this.map.addControl(this.fullscreenControl);
            }
        }
    };

    componentWillUnmount(): void {
        if (this.animationHandle != null) {
            cancelAnimationFrame(this.animationHandle);
        }
        if (this.props.bindKeys) {
            window.removeEventListener('keydown', this.windowKeyBinds);
        }
    }

    async componentDidMount() {
        await this.createMapFromState(this.state);
        if (this.props.bindKeys) {
            window.addEventListener('keydown', this.windowKeyBinds, true);
        }
        if (this.props.positionUpdateFunctionRef) {
            this.props.positionUpdateFunctionRef.current = (
                position: number,
                deltaS: number
            ) => {
                if (deltaS > 2) {
                    // heuristic: if the delta is greater than 2 seconds, it might be paused
                    this.resetFollowCamMomemtum();
                }
                this.updatePointPosition(position, deltaS);
            };
        }
    }

    handlePlayClick = () => {
        // If we're at the end, reset to the beginning
        if (this.playhead >= this.props.gpxInfo.points.length - 1) {
            this.handleProgressClick({ nativeEvent: { offsetX: 0 } });
        }
        this.setState({ isPlaying: !this.state.isPlaying });
    };

    handleProgressClick = (evt: { nativeEvent: { offsetX: number } }) => {
        let offsetFraction =
            evt.nativeEvent.offsetX / this.progressRef.current!.offsetWidth;
        offsetFraction = Math.max(offsetFraction, 0);
        offsetFraction = Math.min(offsetFraction, 1);
        const newPosition = this.props.gpxInfo.points.length * offsetFraction;
        this.resetFollowCamMomemtum();
        this.updatePointPosition(newPosition, 0);
    };

    async createMapFromState(state: State) {
        if (this.animationHandle != null) {
            cancelAnimationFrame(this.animationHandle);
        }
        const gpsPoints = this.props.gpxInfo.points;
        if (this.map == null) {
            this.map = new mapboxgl.Map({
                container: this.mapDivRef.current!,
                zoom: 16,
                pitch: 0,
                center: findCenter(gpsPoints).slice(0, 2) as [number, number],
                style: state.mapStyle,
                accessToken: this.props.mapboxAccessToken,
            });
            this.map.fitBounds(findBounds(gpsPoints));
            this.map.addControl(this.mapControl);
            this.map.addControl(this.fullscreenControl);
        } else {
            // If we have already loaded the map, just set the style. Otherwise it's billable
            this.map.setStyle(state.mapStyle);
        }
        const addSource = (
            id: string,
            points: LatLonEle[],
            params: mapboxgl.LinePaint
        ) => {
            this.map.addSource(id, pointsToGeoJsonFeature(points)).addLayer({
                id,
                type: 'line',
                source: id,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round',
                },
                paint: params,
            });
        };

        await new Promise<void>((resolve) => {
            this.map.once('styledata', () => {
                addSource('gpxTrack', gpsPoints, {
                    'line-color': state.gpxTrackColor,
                    'line-width': state.gpxTrackWidth,
                });
                this.map.addSource('point', {
                    type: 'geojson',
                    data: this.point,
                });
                // Example from mapbox-gl docs
                this.map.addSource('mapbox-dem', {
                    type: 'raster-dem',
                    url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
                    tileSize: 512,
                    maxzoom: 15,
                });
                if (this.state.showTopo) {
                    this.map.setTerrain({ source: 'mapbox-dem', exaggeration: 2 });
                }
                this.map.addLayer({
                    id: 'point',
                    source: 'point',
                    type: 'symbol',
                    layout: {
                        'icon-image': state.pointIcon,
                        'icon-size': state.pointIconSize,
                        'icon-allow-overlap': true,
                        'icon-ignore-placement': true,
                    },
                });
                if (this.state.useFollowTrack) {
                    this.updateTrackDisplay(this.playhead);
                }
                resolve();
            });
        });
        if (!this.props.positionUpdateFunctionRef) {
            requestAnimationFrame(this.animationLoop);
        }
    }

    async componentWillUpdate(props: Props, nextState: State) {
        if (!nextState.isPlaying) {
            // If we paused then reset the camera movement vector
            this.resetFollowCamMomemtum();
        }
        // Did we toggle followcam?
        if (nextState.useFollowCam !== this.state.useFollowCam) {
            this.resetFollowCamMomemtum();
            // Then update the camera on the map
            if (nextState.useFollowCam) {
                this.map.easeTo({
                    zoom: 14.5,
                    pitch: 60,
                    center: toGeoJson(
                        props.gpxInfo.points[Math.floor(this.playhead)]
                    ).slice(0, 2) as [number, number],
                });
            } else {
                this.map.easeTo({
                    pitch: 0,
                    center: findCenter(props.gpxInfo.points).slice(0, 2) as [
                        number,
                        number
                    ],
                    animate: false,
                    bearing: 0,
                });
                this.map.fitBounds(findBounds(props.gpxInfo.points));
            }
        }
        // we don't bother checking of follow track changed between states
        // because the visible behavior is the same
        if (nextState.useFollowTrack) {
            this.updateTrackDisplay(this.playhead);
        } else {
            this.updateTrackDisplay(props.gpxInfo.points.length - 1);
        }
        if (nextState.mapStyle !== this.state.mapStyle) {
            // Changing the style also resets the track and stuff, just re-create it.
            await this.createMapFromState(nextState);
        }
        // should we update the point icon?
        if (nextState.pointIcon !== this.state.pointIcon) {
            this.map.setLayoutProperty('point', 'icon-image', nextState.pointIcon);
        }
        if (nextState.pointIconSize !== this.state.pointIconSize) {
            this.map.setLayoutProperty('point', 'icon-size', nextState.pointIconSize);
        }
        // should we update the gpx track?
        if (nextState.gpxTrackColor !== this.state.gpxTrackColor) {
            this.map.setPaintProperty(
                'gpxTrack',
                'line-color',
                nextState.gpxTrackColor
            );
        }
        if (nextState.gpxTrackWidth !== this.state.gpxTrackWidth) {
            this.map.setPaintProperty(
                'gpxTrack',
                'line-width',
                nextState.gpxTrackWidth
            );
        }
        if (nextState.showTopo !== this.state.showTopo) {
            if (nextState.showTopo) {
                this.map.setTerrain({ source: 'mapbox-dem', exaggeration: 2 });
            } else {
                this.map.setTerrain(null);
            }
        }
    }

    render() {
        const mb = this.props.gpxInfo.sizeBytes / 1000000;
        return (
            <>
                <div className="center gpx-info">
                    Selected: <b>{this.props.gpxInfo.name}</b> ({mb.toFixed(2)} MB)
                </div>
                {this.props.bindKeys && (
                    <div className="center">
                        <b>Tip:</b> use space to play/pause, F to full screen, H to hide
                        controls
                    </div>
                )}
                <div className="map-container-container">
                    <div id="map-container" ref={this.mapDivRef} />
                </div>
                {this.props.showElevationProfile && (
                    <HeightGraphComponent
                        {...this.props}
                        applyPositionUpdate={(applyUpdate) =>
                            (this.applyPositionUpdateToHeightGraph = applyUpdate)
                        }
                    />
                )}
                {!this.props.positionUpdateFunctionRef && (
                    <MapComponentProgress
                        isPlaying={this.state.isPlaying}
                        onPlayClick={this.handlePlayClick}
                        onProgressClick={this.handleProgressClick}
                        progressRef={this.progressRef}
                    />
                )}
                {!this.props.disableOptions && (
                    <MapComponentOptions
                        state={this.state}
                        setState={this.setState.bind(this)}
                        showPlaybackRate={
                            this.props.positionUpdateFunctionRef === undefined
                        }
                    />
                )}
            </>
        );
    }
}
