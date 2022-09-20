import React from 'react';
import { GpxInfo } from '../types';
declare type Props = {
    gpxInfo: GpxInfo;
};
export default class MapComponent extends React.Component<Props, {}> {
    mapDivRef: React.RefObject<HTMLDivElement>;
    componentDidMount(): Promise<void>;
    render(): JSX.Element;
}
export {};
