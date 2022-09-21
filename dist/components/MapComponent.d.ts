import React from 'react';
import { GpxInfo } from '../types';
import mapboxgl from 'mapbox-gl';
declare type Props = {
    gpxInfo: GpxInfo;
};
export default class MapComponent extends React.Component<Props, {}> {
    mapDivRef: React.RefObject<HTMLDivElement>;
    map: mapboxgl.Map;
    componentDidMount(): Promise<void>;
    render(): JSX.Element;
}
export {};
