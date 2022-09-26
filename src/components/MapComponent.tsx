import React from 'react';
import { GpxInfo, LatLon } from '../types';

import { MAPBOX_API_KEY } from '../mapboxApiKey';
import {
    findBounds,
    findCenter,
    toGeoJson,
    toGeoJsonFeature,
    toGeoJsonLineString,
} from '../map';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';

type Props = {
    gpxInfo: GpxInfo;
};

type State = {
    useFollowCam: boolean;
    mapStyle: string;
    // pointsPerFrame is a fixed value that means the number of points each frame
    // should advance so the entire route takes 1 minute to finish. Can be a fractional.
    pointsPerSecond: number;
    // are we currently playing?
    isPlaying: boolean;
    // multiply pointsPerSecond by playbackRate to decide how much to animate per second
    playbackRate: number;
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
            useFollowCam: true,
            // mapStyle: 'mapbox://styles/pelmers/cl8ilg939000u15o5hxcr1mjy',
            mapStyle: 'mapbox://styles/mapbox/outdoors-v11',
            // divide by 60 seconds per minute
            pointsPerSecond: props.gpxInfo.points.length / 60,
            isPlaying: false,
            playbackRate: 5,
        };
        const origin = toGeoJson(props.gpxInfo.points[0]);
        this.point.features[0].geometry.coordinates = origin;
    }

    animationLoop = (t: number) => {
        if (!this.state.isPlaying) {
            this.animationHandle = requestAnimationFrame(this.animationLoop);
            this.lastAnimationTime = null;
            return;
        }
        if (this.lastAnimationTime != null) {
            this.animationBody(t - this.lastAnimationTime);
        }
        this.lastAnimationTime = t;
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
        this.updatePointPosition(newPosition);

        // We've reached the end, pause the playback indicator
        if (newPosition === points.length - 1) {
            this.setState({ isPlaying: false });
        }
        this.playhead = newPosition;
    }
    
    updatePointPosition(newPosition: number) {
        const {points} = this.props.gpxInfo;
        const currentFrameFeature = toGeoJsonFeature(points[Math.floor(this.playhead)]);
        const nextFrameFeature = toGeoJsonFeature(points[Math.floor(newPosition)]);

        const nextBearing = turf.bearing(currentFrameFeature, nextFrameFeature);
        const nextDist = turf.distance(currentFrameFeature, nextFrameFeature);
        const interpPoint = turf.along(
            toGeoJsonLineString(
                points[Math.floor(this.playhead)],
                points[Math.floor(newPosition)]
            ),
            nextDist * (newPosition - this.playhead) +
                (this.playhead - Math.floor(this.playhead))
        );

        // @ts-ignore it's okay this is fine
        this.point.features[0] = interpPoint;
        this.point.features[0].properties.bearing = nextBearing;
        (this.map.getSource('point') as mapboxgl.GeoJSONSource).setData(this.point);

        // TODO: if follow mode update camera
        // TODO: set new state on the progress bar
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
            this.map
                .addSource(id, {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'LineString',
                            coordinates: points.map(toGeoJson),
                        },
                    },
                })
                .addLayer({
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
                    // TODO: let user pick color/width?
                    'line-color': '#ff0',
                    'line-width': 4,
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
                        // TODO: allow customize the icon
                        'icon-image': 'bicycle-15',
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

    render() {
        // TODO outline:
        // 1. map itself
        // 2. scrubbable progress bar, and playback rate (also slider?)
        // 3. followcam toggle
        // 4. inputs for the different options:
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
                        {/* TODO: on seek, update the icon position */}
                        <progress max="100" value="0" className="play-progress" ref={this.progressRef}>
                            Progress
                        </progress>
                    </div>
                    {/* TODO: options for the things */}
                </div>
            </>
        );
    }
}
