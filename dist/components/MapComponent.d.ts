import React from 'react';
import { GpxInfo } from '../types';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
import '../../static/map.css';
type Props = {
    gpxInfo: GpxInfo;
    bindKeys: boolean;
    showElevationProfile: boolean;
    mapboxAccessToken: string;
    playbackFPS: number;
    positionUpdateFunctionRef?: React.MutableRefObject<(position: number, deltaS: number) => void>;
    initialState?: Partial<State>;
    disableOptions?: boolean;
};
export type State = {
    useFollowCam: boolean;
    followSensitivity: number;
    followMomentum: number;
    useFollowTrack: boolean;
    mapStyle: string;
    showTopo: boolean;
    pointsPerSecond: number;
    isPlaying: boolean;
    playbackRate: number;
    gpxTrackWidth: number;
    gpxTrackColor: string;
    pointIcon: string;
    pointIconSize: number;
    camMomentumRollingAvgInterval: number;
};
export type SetStateFunc = MapComponent['setState'];
export default class MapComponent extends React.Component<Props, State> {
    mapDivRef: React.RefObject<HTMLDivElement>;
    progressRef: React.RefObject<HTMLProgressElement>;
    applyPositionUpdateToHeightGraph: (position: number) => void;
    map: mapboxgl.Map;
    mapControl: mapboxgl.NavigationControl;
    fullscreenControl: mapboxgl.FullscreenControl;
    playhead: number;
    lastAnimationTime: number | null;
    lastFollowcamMoveVector: {
        momentumVec: [number, number] | null;
        lastCenter: turf.Position | null;
        lastVecs: [number, number][];
    };
    animationHandle: number;
    point: {
        type: "FeatureCollection";
        features: {
            type: "Feature";
            properties: {
                [key: string]: unknown;
            };
            geometry: {
                type: "Point";
                coordinates: number[];
            };
        }[];
    };
    constructor(props: Props);
    /**
     * The main animation loop, checks if we are in playing state and then calls animationBody
     * once the time since last animation exceeds minAnimationTime.
     * On the first frame of playback we do not actually run the animation body,
     * but instead we only store the time.
     * That's because the camera animation expects a duration and we do not know in
     * advance what the frame timing is.
     * @param t timestamp
     */
    animationLoop: (t: number) => void;
    /**
     * Runs the animation by computing a new position based on the playback rate and
     * updating the point to that position.
     * @param timeDeltaMs time since last animation frame in milliseconds
     */
    animationBody(timeDeltaMs: number): void;
    /**
     * Compute an in-between coordinate between two points on the gpx track.
     * @param position possibly fractional position in the range [0, points.length - 1)
     * @returns an object {point: Feature, bearing: number}
     * Note: the end range is not inclusive! position must be strictly less than points.length - 1
     */
    interpolatePoint(position: number): {
        point: turf.helpers.Feature<turf.helpers.Point, turf.helpers.Properties>;
        bearing: number;
    };
    resetFollowCamMomemtum(): void;
    /**
     * Find new map position parameters based on followcam settings
     * @param timeDeltaS time since the last frame
     * @param pointPos the lng/lat position of the point
     * @returns parameters {center: Position, fixedBearing: number} for map view update
     */
    updateFollowCamParameters(timeDeltaS: number, pointPos: turf.Position): {
        cameraBearing: number;
        center: turf.helpers.Position;
    };
    /**
     * Update the point's position on the map, and possibly animate the camera to follow.
     * Also updates the progress bar and track display if on FollowTrack
     * @param newPosition index into the gpx track, can be fractional
     * @param timeDeltaS how long the camera move should take, in seconds
     */
    updatePointPosition(newPosition: number, timeDeltaS: number): void;
    /**
     * Update the gps track, pass in `points.length - 1` to show the entire track.
     * @param position index into the gpx track, can be fractional
     */
    updateTrackDisplay(position: number): void;
    windowKeyBinds: (e: KeyboardEvent) => void;
    componentWillUnmount(): void;
    componentDidMount(): Promise<void>;
    handlePlayClick: () => void;
    handleProgressClick: (evt: {
        nativeEvent: {
            offsetX: number;
        };
    }) => void;
    createMapFromState(state: State): Promise<void>;
    componentWillUpdate(props: Props, nextState: State): Promise<void>;
    render(): JSX.Element;
}
export {};
