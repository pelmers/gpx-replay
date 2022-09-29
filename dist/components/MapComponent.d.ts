import React from 'react';
import { GpxInfo } from '../types';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
declare type Props = {
    gpxInfo: GpxInfo;
    bindKeys: boolean;
};
declare type State = {
    useFollowCam: boolean;
    followSensitivity: number;
    useFollowTrack: boolean;
    mapStyle: string;
    pointsPerSecond: number;
    isPlaying: boolean;
    playbackRate: number;
    gpxTrackWidth: number;
    gpxTrackColor: string;
    pointIcon: string;
    pointIconSize: number;
};
export default class MapComponent extends React.Component<Props, State> {
    mapDivRef: React.RefObject<HTMLDivElement>;
    progressRef: React.RefObject<HTMLProgressElement>;
    map: mapboxgl.Map;
    mapControl: mapboxgl.NavigationControl;
    fullscreenControl: mapboxgl.FullscreenControl;
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
    windowKeyBinds: (e: KeyboardEvent) => void;
    componentWillUnmount(): void;
    componentDidMount(): Promise<void>;
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
