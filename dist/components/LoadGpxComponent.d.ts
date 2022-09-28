import React from 'react';
declare type Props = {
    onGpxLoad: (gpxFile: File, smoothingFactor: number) => unknown;
};
declare type State = {
    smoothingFactor: number;
};
export default class LoadGpxComponent extends React.Component<Props, State> {
    gpxInputRef: React.RefObject<HTMLInputElement>;
    state: {
        smoothingFactor: number;
    };
    render(): JSX.Element;
}
export {};
