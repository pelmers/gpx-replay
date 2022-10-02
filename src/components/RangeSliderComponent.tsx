// React component that renders a range slider with a label and callback on change

import React from 'react';
import LabelInputWithHelp from './LabelInputWithHelp';

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
    render() {
        // If the step is 0.1, then we show one space after the decimal
        // Otherwise we show two (in future could extend this arbitrarily)
        const fixedValue = Number.isInteger(this.props.step * 10) ? 1 : 2;

        const label = <label>{this.props.label}</label>;
        const input = (
            <div style={{ display: 'inline' }}>
                <label
                    style={{
                        marginRight: '5px',
                        width: '4ch',
                        display: 'inline-block',
                    }}
                >
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
        );
        return this.props.helpText ? (
            <LabelInputWithHelp
                label={label}
                input={input}
                helpText={this.props.helpText}
            />
        ) : (
            <>
                {label}
                {input}
            </>
        );
    }
}
