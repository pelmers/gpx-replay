import React from 'react';
import { GpxInfo } from '../types';
import 'map.heightgraph/src/heightgraph.css';
export type HeightGraphComponentProps = {
    gpxInfo: GpxInfo;
    applyPositionUpdate: (sendUpdateToMe: (position: number) => void) => void;
};
export declare class HeightGraphComponent extends React.Component<HeightGraphComponentProps> {
    heightGraphDivRef: React.RefObject<HTMLDivElement>;
    heightGraph: any;
    cumulativeDistanceList: number[];
    constructor(props: HeightGraphComponentProps);
    render(): JSX.Element;
    componentDidMount(): void;
}
