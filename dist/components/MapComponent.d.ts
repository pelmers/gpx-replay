import React from 'react';
import { GpxInfo } from '../types';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
declare type Props = {
    gpxInfo: GpxInfo;
};
declare type State = {
    useFollowCam: boolean;
    useFollowTrack: boolean;
    mapStyle: string;
    pointsPerSecond: number;
    isPlaying: boolean;
    playbackRate: number;
    gpxTrackWidth: number;
    gpxTrackColor: string;
    pointIcon: string;
};
export default class MapComponent extends React.Component<Props, State> {
    mapDivRef: React.RefObject<HTMLDivElement>;
    progressRef: React.RefObject<HTMLProgressElement>;
    map: mapboxgl.Map;
    playhead: number;
    lastAnimationTime: number | null;
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
    animationLoop: (t: number) => void;
    animationBody(timeDeltaMs: number): void;
    interpolatePoint(position: number): {
        point: turf.helpers.Feature<turf.helpers.Point, turf.helpers.Properties>;
        bearing: number;
    };
    updatePointPosition(newPosition: number, timeDeltaS: number): void;
    updateTrackDisplay(position: number): void;
    componentWillUnmount(): void;
    componentDidMount(): Promise<void>;
    handleProgressClick: (evt: {
        nativeEvent: {
            offsetX: number;
        };
    }) => void;
    componentWillUpdate(props: Props, nextState: State): void;
    render(): JSX.Element;
}
export {};
