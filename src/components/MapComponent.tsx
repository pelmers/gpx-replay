import React from 'react';
import { GpxInfo, LatLon } from '../types';

import { MAPBOX_API_KEY } from '../mapboxApiKey';
import {
    findBounds,
    findCenter,
    geoJsonToPoint,
    pointsToGeoJsonFeature,
    toGeoJson,
    toGeoJsonFeature,
    toGeoJsonLineString,
} from '../map';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';

const clamp = (num: number, lo: number, hi: number) =>
    num < lo ? lo : num > hi ? hi : num;

// Given bearings a and b in the range [-180, 180], return the short angle that moves a to b.
// examples:
// if a is 10 and b is -10, then the answer is -20.
// if a is -10 and b is 10, then the answer is 20.
// if a is -170 and b is 170, then the answer is -20.
// if a is 170 and b is -170, then the answer is 20.
const bearingDiff = (a: number, b: number) => {
    // diff will be in the range [0, 360]
    const diff = Math.abs(b - a);
    const sign = b > a ? 1 : -1;
    return sign * (diff > 180 ? -(360 - diff) : diff);
};

// Fix a bearing between [-360, 360] to [-180, 180]
const fixBearingDomain = (b: number) => {
    if (b < -180) {
        return 360 + b;
    } else if (b > 180) {
        return -360 + b;
    }
    return b;
};

type Props = {
    gpxInfo: GpxInfo;
};

type State = {
    useFollowCam: boolean;
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
};

export default class MapComponent extends React.Component<Props, State> {
    mapDivRef = React.createRef<HTMLDivElement>();
    progressRef = React.createRef<HTMLProgressElement>();

    map: mapboxgl.Map;
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
            useFollowTrack: false,
            // mapStyle: 'mapbox://styles/pelmers/cl8ilg939000u15o5hxcr1mjy',
            mapStyle: 'mapbox://styles/mapbox/outdoors-v11',
            // divide by 60 seconds per minute
            pointsPerSecond: props.gpxInfo.points.length / 60,
            isPlaying: false,
            playbackRate: 1,
            gpxTrackWidth: 4,
            gpxTrackColor: '#ff0',
            pointIcon: 'bicycle-15',
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
        // cap at 120 fps
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
            const changeCap = 30 * timeDeltaS;
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

    componentWillUnmount(): void {
        if (this.animationHandle != null) {
            cancelAnimationFrame(this.animationHandle);
        }
    }

    async componentDidMount() {
        const gpsPoints = this.props.gpxInfo.points;
        this.map = new mapboxgl.Map({
            container: this.mapDivRef.current!,
            zoom: 16,
            pitch: 0,
            center: findCenter(gpsPoints),
            style: this.state.mapStyle,
            accessToken: MAPBOX_API_KEY,
        });
        this.map.fitBounds(findBounds(gpsPoints));
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
                    'line-color': this.state.gpxTrackColor,
                    'line-width': this.state.gpxTrackWidth,
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
                        'icon-image': this.state.pointIcon,
                        'icon-size': 2,
                        'icon-allow-overlap': true,
                        'icon-ignore-placement': true,
                    },
                });
                resolve();
            });
        });
        requestAnimationFrame(this.animationLoop);
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

    componentWillUpdate(props: Props, nextState: State) {
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
    }

    render() {
        // TODO outline:
        // 1. map itself
        // 2. scrubbable progress bar, and playback rate (also slider?)
        // 3. followcam toggle
        // 4. draw route behind toggle
        // 5. inputs for the different options:
        //  - constant speed or given speed
        //  - map style
        //  - icon type, icon size
        //  - line color, line thickness
        // bonus:
        // - elevation profile?
        const mb = this.props.gpxInfo.sizeBytes / 1000000;
        return (
            <>
                <div className="center gpx-info">
                    Selected: <b>{this.props.gpxInfo.name}</b> ({mb.toFixed(2)} MB)
                </div>
                <div id="map-container" ref={this.mapDivRef} />
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
                        <label className="play-percent" role="percentage indicator" />
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
                    {/* TODO: options for the things */}
                </div>
                <div className="center control-group">
                    Use FollowCam{' '}
                    <input
                        type="checkbox"
                        defaultChecked={this.state.useFollowCam}
                        onChange={() =>
                            this.setState({ useFollowCam: !this.state.useFollowCam })
                        }
                    />
                    Use FollowTrack{' '}
                    <input
                        type="checkbox"
                        defaultChecked={this.state.useFollowTrack}
                        onChange={() =>
                            this.setState({
                                useFollowTrack: !this.state.useFollowTrack,
                            })
                        }
                    />
                </div>
            </>
        );
    }
}
