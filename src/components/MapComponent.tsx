import React from 'react';
import { GpxInfo, LatLon } from '../types';

import { MAPBOX_API_KEY } from '../mapboxApiKey';
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
import RangeSliderComponent from './RangeSliderComponent';
import LabelInputWithHelp from './LabelInputWithHelp';
import CheckboxControlInputComponent from './CheckboxControlInputComponent';

type Props = {
    gpxInfo: GpxInfo;
    bindKeys: boolean;
};

type State = {
    useFollowCam: boolean;
    followSensitivity: number;
    followMomentum: number;
    useFollowTrack: boolean;
    mapStyle: string;
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
};

type SetStateFunc = MapComponent['setState'];

export default class MapComponent extends React.Component<Props, State> {
    mapDivRef = React.createRef<HTMLDivElement>();
    progressRef = React.createRef<HTMLProgressElement>();

    map: mapboxgl.Map;
    mapControl = new mapboxgl.NavigationControl();
    fullscreenControl = new mapboxgl.FullscreenControl();
    // where is the bike along the track? can be fractional, in the range [0, # points]
    // TODO: can i put this number in the state?
    playhead: number = 0;
    lastAnimationTime: number | null = null;
    lastFollowcamMoveVector: {
        lastVec: [number, number] | null;
        lastCenter: turf.Position | null;
    } = { lastVec: null, lastCenter: null };
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
            useFollowCam: false,
            followSensitivity: 45,
            followMomentum: 0,
            useFollowTrack: false,
            mapStyle: 'mapbox://styles/mapbox/outdoors-v11',
            // divide by 60 seconds per minute
            pointsPerSecond: props.gpxInfo.points.length / 60,
            isPlaying: false,
            playbackRate: 1,
            gpxTrackWidth: 4,
            gpxTrackColor: '#ffff00',
            pointIcon: 'bicycle-15',
            pointIconSize: 2,
        };
        const origin = toGeoJson(props.gpxInfo.points[0]);
        this.point.features[0].geometry.coordinates = origin;
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
        // cap at 40 fps
        const minAnimationTime = 1000 / 40;
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
        this.playhead = newPosition;
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
        this.lastFollowcamMoveVector = { lastVec: null, lastCenter: null };
    }

    /**
     * Find new map position parameters based on followcam settings
     * @param timeDeltaS time since the last frame
     * @param pointPos the lng/lat position of the point
     * @param bearing the bearing of the point
     * @returns parameters {center: Position, fixedBearing: number} for map view update
     */
    updateFollowCamParameters(
        timeDeltaS: number,
        pointPos: turf.Position,
        bearing: number
    ) {
        const rot = bearingDiff(this.map.getBearing(), bearing);
        // Cap the camera rotation rate at specified degrees/second to prevent dizziness
        // After adding the rotation, reset domain to [-180, 180]
        // because moving from +170 to -170 is +20, which goes to 190, and out of bounds.
        const changeCap = this.state.followSensitivity * timeDeltaS;
        const fixedBearing = fixBearingDomain(
            this.map.getBearing() + clamp(rot, -changeCap, changeCap)
        );
        let newCenter = pointPos;
        const { lastVec, lastCenter } = this.lastFollowcamMoveVector;
        if (this.state.isPlaying && lastVec == null && lastCenter != null) {
            // We are playing but we have not recorded a last camera move (so this is first frame)
            this.lastFollowcamMoveVector.lastVec = [
                pointPos[0] - lastCenter[0],
                pointPos[1] - lastCenter[1],
            ];
        } else if (this.state.isPlaying && lastVec != null && lastCenter != null) {
            // We are playing and we know a last movement vector
            const baseMoveVector = [
                pointPos[0] - lastCenter[0],
                pointPos[1] - lastCenter[1],
            ];
            // Take the weighted sum between baseMoveVector and lastFollowcamMoveVector
            const newMoveVector = [
                (1 - this.state.followMomentum) * baseMoveVector[0] +
                    this.state.followMomentum * lastVec[0],
                (1 - this.state.followMomentum) * baseMoveVector[1] +
                    this.state.followMomentum * lastVec[1],
            ];
            // Add the newMoveVector to the last center to get the new center
            newCenter = [
                lastCenter[0] + newMoveVector[0],
                lastCenter[1] + newMoveVector[1],
            ];
        }
        this.lastFollowcamMoveVector.lastCenter = newCenter;
        return { fixedBearing, center: newCenter };
    }

    /**
     * Update the point's position on the map, and possibly animate the camera to follow.
     * Also updates the progress bar and track display if on FollowTrack
     * @param newPosition index into the gpx track, can be fractional
     * @param timeDeltaS how long the camera move should take, in seconds
     */
    updatePointPosition(newPosition: number, timeDeltaS: number) {
        const { points } = this.props.gpxInfo;
        const pointIndex = Math.floor(newPosition);
        if (pointIndex === points.length - 1) {
            this.point.features[0] = toGeoJsonFeature(points[pointIndex]);
            return;
        }

        const { point, bearing } = this.interpolatePoint(newPosition);

        // TODO: fix a bit of stuttering issue (noticeable in followcam)
        // @ts-ignore it's okay this is fine
        this.point.features[0] = point;
        this.point.features[0].properties.bearing = bearing;
        (this.map.getSource('point') as mapboxgl.GeoJSONSource).setData(this.point);

        // Update progress bar percentage based on this position
        if (this.progressRef.current != null) {
            this.progressRef.current.value = (100 * newPosition) / (points.length - 1);
        }

        if (this.state.useFollowCam) {
            const { center, fixedBearing } = this.updateFollowCamParameters(
                timeDeltaS,
                point.geometry.coordinates,
                bearing
            );
            this.map.easeTo({
                // @ts-ignore this is fine
                center,
                bearing: fixedBearing,
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
            this.setState({ isPlaying: !this.state.isPlaying });
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
    }

    handleProgressClick = (evt: { nativeEvent: { offsetX: number } }) => {
        let offsetFraction =
            evt.nativeEvent.offsetX / this.progressRef.current!.offsetWidth;
        offsetFraction = Math.max(offsetFraction, 0);
        offsetFraction = Math.min(offsetFraction, 1);
        const newPosition = this.props.gpxInfo.points.length * offsetFraction;
        this.resetFollowCamMomemtum();
        this.updatePointPosition(newPosition, 0);
        this.playhead = newPosition;
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
                center: findCenter(gpsPoints),
                style: state.mapStyle,
                accessToken: MAPBOX_API_KEY,
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
            points: LatLon[],
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
        requestAnimationFrame(this.animationLoop);
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
                    center: toGeoJson(props.gpxInfo.points[Math.floor(this.playhead)]),
                });
            } else {
                this.map.easeTo({
                    pitch: 0,
                    center: findCenter(props.gpxInfo.points),
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
    }

    render() {
        // TODO bonus: elevation profile?
        const mb = this.props.gpxInfo.sizeBytes / 1000000;
        return (
            <>
                <div className="center gpx-info">
                    Selected: <b>{this.props.gpxInfo.name}</b> ({mb.toFixed(2)} MB)
                </div>
                <div className="center">
                    <b>Tip:</b> use space to play/pause, F to full screen, H to hide
                    controls
                </div>
                <div className="map-container-container">
                    <div id="map-container" ref={this.mapDivRef} />
                </div>
                <MapComponentProgress
                    isPlaying={this.state.isPlaying}
                    onPlayClick={() => {
                        this.setState({ isPlaying: !this.state.isPlaying });
                    }}
                    onProgressClick={this.handleProgressClick}
                    progressRef={this.progressRef}
                />
                <MapComponentOptions
                    state={this.state}
                    setState={this.setState.bind(this)}
                />
            </>
        );
    }
}

function MapComponentProgress(props: {
    onPlayClick: React.MouseEventHandler;
    onProgressClick: React.MouseEventHandler;
    isPlaying: boolean;
    progressRef: React.Ref<HTMLProgressElement>;
}) {
    return (
        <div className="center">
            <div className="progress-container">
                <button
                    aria-label="Play"
                    role="button"
                    className="play-button"
                    onClick={props.onPlayClick}
                >
                    {props.isPlaying ? '❚❚' : '►'}
                </button>
                <progress
                    max="100"
                    value="0"
                    className="play-progress"
                    ref={props.progressRef}
                    onClick={props.onProgressClick}
                >
                    Progress
                </progress>
            </div>
        </div>
    );
}

function MapComponentOptions(props: { state: State; setState: SetStateFunc }) {
    const { state, setState } = props;
    return (
        <>
            <div className="center control-group">
                <CheckboxControlInputComponent
                    labelText="FollowCam"
                    defaultChecked={state.useFollowCam}
                    helpText="When checked, camera follows point during playback"
                    onChange={(checked) => setState({ useFollowCam: checked })}
                />
                <CheckboxControlInputComponent
                    labelText="FollowTrack"
                    defaultChecked={state.useFollowCam}
                    helpText="When checked, GPX track follows point during playback"
                    onChange={(checked) => setState({ useFollowTrack: checked })}
                />
            </div>
            <div className="center control-group">
                {state.useFollowCam && (
                    <RangeSliderComponent
                        label="Follow Sensitivity"
                        min={0}
                        max={180}
                        step={1}
                        helpText="In FollowCam, limits how quickly the camera can rotate, expressed in degrees per second. At 0 the camera direction will be fixed, so it will only pan."
                        value={state.followSensitivity}
                        onChange={(v) => setState({ followSensitivity: v })}
                    />
                )}
                {state.useFollowCam && (
                    <RangeSliderComponent
                        label="Follow Momentum"
                        min={0}
                        max={0.99}
                        step={0.01}
                        helpText="In FollowCam, adjusts the camera movement by continuing to pan in the direction of the last frame, scaled by this factor. So a factor of 0 means we move the map such that the track point is exactly in the center. A factor of 1 would mean we only move in the same direction as the last frame. The camera will move more smoothly but will not follow the exact point as closely."
                        value={state.followMomentum}
                        onChange={(v) => setState({ followMomentum: v })}
                    />
                )}

                <RangeSliderComponent
                    label={'Playback Rate'}
                    min={0.2}
                    max={20}
                    step={0.2}
                    value={state.playbackRate}
                    helpText="Multiplier for playback speed. Default playback speed is tuned so it finishes in exactly 60 seconds (regardless GPX track length)."
                    onChange={(value) => setState({ playbackRate: value })}
                />
            </div>
            <div className="center control-group">
                {/* styles from https://docs.mapbox.com/api/maps/styles/ */}
                <label htmlFor="map-style">Map Style</label>
                <select
                    name="map style"
                    onChange={(evt) => {
                        // Also set isPlaying to false because changing the style reloads the map
                        // while the map is loading, the point and the track are not yet set
                        setState({
                            mapStyle: evt.target.value,
                            isPlaying: false,
                        });
                    }}
                    defaultValue={state.mapStyle}
                >
                    <option value="mapbox://styles/mapbox/outdoors-v11">
                        Outdoors
                    </option>
                    <option value="mapbox://styles/mapbox/streets-v11">Streets</option>
                    <option value="mapbox://styles/mapbox/light-v10">Light</option>
                    <option value="mapbox://styles/mapbox/dark-v10">Dark</option>
                    <option value="mapbox://styles/mapbox/satellite-v9">
                        Satellite
                    </option>
                    <option value="mapbox://styles/mapbox/satellite-streets-v11">
                        Satellite Streets
                    </option>
                    <option value="mapbox://styles/mapbox/navigation-day-v1">
                        Navigation Day
                    </option>
                    <option value="mapbox://styles/mapbox/navigation-night-v1">
                        Navigation Night
                    </option>
                    <option value="mapbox://styles/pelmers/cl8ilg939000u15o5hxcr1mjy">
                        Peter Custom Satellite
                    </option>
                </select>

                {/* List available at https://github.com/mapbox/mapbox-gl-styles#standard-icons  */}
                <LabelInputWithHelp
                    label={<label>Point Icon</label>}
                    input={
                        <select
                            defaultValue={state.pointIcon}
                            onChange={(evt) => {
                                setState({ pointIcon: evt.target.value });
                            }}
                        >
                            <option value="bicycle-15">Bicycle</option>
                            <option value="rocket-15">Rocket</option>
                            <option value="swimming-15">Swimmer</option>
                            <option value="bus-15">Bus</option>
                            <option value="rail-15">Train</option>
                            <option value="pitch-15">Runner</option>
                            <option value="car-15">Death Cage</option>
                            <option value="circle-15">Circle</option>
                        </select>
                    }
                    helpText={
                        'Icon to use for the point. Note: not all styles support every icon. If you have a specific request please file an issue. (Or better yet, submit a fix!)'
                    }
                />

                <RangeSliderComponent
                    label={'Point Icon Size'}
                    min={0.0}
                    max={25}
                    step={0.5}
                    value={state.pointIconSize}
                    onChange={(value) => setState({ pointIconSize: value })}
                />

                <label htmlFor="line-color">Line Color</label>
                <input
                    type="color"
                    name="line-color"
                    defaultValue={state.gpxTrackColor}
                    onChange={(ev) => {
                        setState({ gpxTrackColor: ev.target.value });
                    }}
                />

                <RangeSliderComponent
                    label={'Line Thickness'}
                    min={0.0}
                    max={30}
                    step={0.5}
                    value={state.gpxTrackWidth}
                    onChange={(value) => setState({ gpxTrackWidth: value })}
                />
            </div>
        </>
    );
}
