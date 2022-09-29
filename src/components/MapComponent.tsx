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

type Props = {
    gpxInfo: GpxInfo;
    bindKeys: boolean;
};

type State = {
    useFollowCam: boolean;
    followSensitivity: number;
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
            useFollowTrack: false,
            // mapStyle: 'mapbox://styles/pelmers/cl8ilg939000u15o5hxcr1mjy',
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

    animationBody(timeDeltaMs: number): void {
        // Note: times are in milliseconds.
        const timeDeltaS = timeDeltaMs / 1000;
        // Compute how many frames to advance the playhead based on the time difference and playback rate
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
            const rot = bearingDiff(this.map.getBearing(), bearing);
            // Cap the camera rotation rate at 30 degrees/second to prevent dizziness
            // After adding the rotation, reset domain to [-180, 180]
            // because moving from +170 to -170 is +20, which goes to 190, and out of bounds.
            const changeCap = this.state.followSensitivity * timeDeltaS;
            const fixedBearing = fixBearingDomain(
                this.map.getBearing() + clamp(rot, -changeCap, changeCap)
            );
            const center = point.geometry.coordinates;
            this.map.easeTo({
                // @ts-ignore bug in typings
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
            // TODO: this seems to lag with followcam and lots of points?
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
                this.mapDivRef.current!.requestFullscreen();
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
        // Did we toggle followcam?
        if (nextState.useFollowCam !== this.state.useFollowCam) {
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
        if (nextState.useFollowTrack) {
            this.updateTrackDisplay(this.playhead);
        } else {
            this.updateTrackDisplay(props.gpxInfo.points.length - 1);
        }
        if (nextState.mapStyle !== this.state.mapStyle) {
            // Changing the style also resets the track and stuff, just re-create it.
            await this.createMapFromState(nextState);
        }
        if (nextState.pointIcon !== this.state.pointIcon) {
            this.map.setLayoutProperty('point', 'icon-image', nextState.pointIcon);
        }
        if (nextState.pointIconSize !== this.state.pointIconSize) {
            this.map.setLayoutProperty('point', 'icon-size', nextState.pointIconSize);
        }
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
                <div className="center">
                    <div className="progress-container">
                        <button
                            aria-label="Play"
                            role="button"
                            className="play-button"
                            onClick={() =>
                                this.setState({ isPlaying: !this.state.isPlaying })
                            }
                        >
                            {this.state.isPlaying ? '❚❚' : '►'}
                        </button>
                        <progress
                            max="100"
                            value="0"
                            className="play-progress"
                            ref={this.progressRef}
                            onClick={this.handleProgressClick}
                        >
                            Progress
                        </progress>
                    </div>
                </div>
                <div className="center control-group">
                    <LabelInputWithHelp
                        label={<label>FollowCam</label>}
                        input={
                            <input
                                type="checkbox"
                                defaultChecked={this.state.useFollowCam}
                                onChange={() =>
                                    this.setState({
                                        useFollowCam: !this.state.useFollowCam,
                                    })
                                }
                                style={{ maxWidth: '32px' }}
                            />
                        }
                        helpText={'When checked, camera follows point during playback'}
                    />
                    <LabelInputWithHelp
                        label={<label>FollowTrack</label>}
                        input={
                            <input
                                type="checkbox"
                                defaultChecked={this.state.useFollowTrack}
                                onChange={() =>
                                    this.setState({
                                        useFollowTrack: !this.state.useFollowTrack,
                                    })
                                }
                                style={{ maxWidth: '32px' }}
                            />
                        }
                        helpText={
                            'When checked, GPX track follows point during playback'
                        }
                    />
                </div>
                <div className="center control-group">
                    {this.state.useFollowCam && (
                        <RangeSliderComponent
                            label="Follow Sensitivity"
                            min={0}
                            max={180}
                            step={1}
                            helpText="In FollowCam, limits how quickly the camera can spin, expressed in degrees per second. At 0 the camera direction will be fixed, so it will only pan."
                            value={this.state.followSensitivity}
                            onChange={(v) => this.setState({ followSensitivity: v })}
                        />
                    )}

                    <RangeSliderComponent
                        label={'Playback Rate'}
                        min={0.2}
                        max={20}
                        step={0.2}
                        value={this.state.playbackRate}
                        helpText="Multiplier for playback speed. Default playback speed is tuned so it finishes in exactly 60 seconds (regardless GPX track length)."
                        onChange={(value) => this.setState({ playbackRate: value })}
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
                            this.setState({
                                mapStyle: evt.target.value,
                                isPlaying: false,
                            });
                        }}
                        defaultValue={this.state.mapStyle}
                    >
                        <option value="mapbox://styles/mapbox/outdoors-v11">
                            Outdoors
                        </option>
                        <option value="mapbox://styles/mapbox/streets-v11">
                            Streets
                        </option>
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
                                defaultValue={this.state.pointIcon}
                                onChange={(evt) => {
                                    this.setState({ pointIcon: evt.target.value });
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
                        value={this.state.pointIconSize}
                        onChange={(value) => this.setState({ pointIconSize: value })}
                    />

                    <label htmlFor="line-color">Line Color</label>
                    <input
                        type="color"
                        name="line-color"
                        defaultValue={this.state.gpxTrackColor}
                        onChange={(ev) => {
                            this.setState({ gpxTrackColor: ev.target.value });
                        }}
                    />

                    <RangeSliderComponent
                        label={'Line Thickness'}
                        min={0.0}
                        max={30}
                        step={0.5}
                        value={this.state.gpxTrackWidth}
                        onChange={(value) => this.setState({ gpxTrackWidth: value })}
                    />
                </div>
            </>
        );
    }
}
