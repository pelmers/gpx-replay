import React from 'react';
type Props = {
    onGpxLoad: (gpxFile: File, smoothingFactor: number, joinTracks: boolean) => unknown;
};
type State = {
    smoothingFactor: number;
    joinTracks: boolean;
};
export default class LoadGpxComponent extends React.Component<Props, State> {
    gpxInputRef: React.RefObject<HTMLInputElement>;
    state: {
        smoothingFactor: number;
        joinTracks: boolean;
    };
    render(): JSX.Element;
}
export {};
