import React from 'react';
type Props = {
    label: string;
    min: number;
    max: number;
    value: number;
    step: number;
    onChange: (value: number) => unknown;
    helpText?: string | JSX.Element;
};
export default class RangeSliderComponent extends React.Component<Props, {}> {
    render(): JSX.Element;
}
export {};
