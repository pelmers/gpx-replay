import React from 'react';
declare type Props = {
    onGpxLoad: (gpxFile: File) => unknown;
};
export default class LoadGpxComponent extends React.Component<Props, {}> {
    gpxInputRef: React.RefObject<HTMLInputElement>;
    render(): JSX.Element;
}
export {};
