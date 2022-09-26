import React from 'react';
import { GpxInfo } from '../types';
import mapboxgl from 'mapbox-gl';
declare type Props = {
    gpxInfo: GpxInfo;
};
declare type State = {
    useFollowCam: boolean;
    mapStyle: string;
    pointsPerSecond: number;
    isPlaying: boolean;
    playbackRate: number;
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
    updatePointPosition(newPosition: number): void;
    componentWillUnmount(): void;
    componentDidMount(): Promise<void>;
    handleProgressClick: (evt: {
        nativeEvent: {
            offsetX: number;
        };
    }) => void;
    render(): JSX.Element;
}
export {};
