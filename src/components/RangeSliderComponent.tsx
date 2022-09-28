// React component that renders a range slider with a label and callback on change

import React from 'react';

type Props = {
    label: string;
    min: number;
    max: number;
    value: number;
    step: number;
    onChange: (value: number) => unknown;
};

export default class RangeSliderComponent extends React.Component<Props, {}> {
    render() {
        // If the step is 0.1, then we show one space after the decimal
        // Otherwise we show two (in future could extend this arbitrarily)
        const fixedValue = Number.isInteger(this.props.step * 10) ? 1 : 2;
        return (
            <>
                <label>{this.props.label}</label>
                <div style={{ display: 'inline' }}>
                    <label style={{ marginRight: '25px' }}>
                        {this.props.value.toFixed(fixedValue)}
                    </label>
                    <input
                        type="range"
                        min={this.props.min}
                        max={this.props.max}
                        step={this.props.step}
                        value={this.props.value}
                        onChange={(e) => this.props.onChange(Number(e.target.value))}
                    />
                </div>
            </>
        );
    }
}
