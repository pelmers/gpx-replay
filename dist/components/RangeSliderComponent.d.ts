import React from 'react';
declare type Props = {
    label: string;
    min: number;
    max: number;
    value: number;
    step: number;
    onChange: (value: number) => unknown;
};
export default class RangeSliderComponent extends React.Component<Props, {}> {
    render(): JSX.Element;
}
export {};
