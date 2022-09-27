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
        return (
            <>
                <label>{this.props.label}</label>
                <div style={{ display: 'inline' }}>
                    <label style={{ marginRight: '25px' }}>
                        {this.props.value.toFixed(1)}
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
