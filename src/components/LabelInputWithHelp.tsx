/**
 * Component that wraps a label and an input field, so that when you click the label
 * a help span is shown.
 */

import React from 'react';

type Props = {
    label: JSX.Element;
    input: JSX.Element;
    helpText: string | JSX.Element;
};

type State = {
    expanded: boolean;
};

export default class LabelInputWithHelp extends React.Component<Props, State> {
    state = {
        expanded: false,
    };

    render() {
        return (
            <>
                <span
                    className="labelInputWithHelp"
                    onClick={() => this.setState({ expanded: !this.state.expanded })}
                >
                    {this.props.label}
                </span>
                {this.props.input}
                {this.state.expanded && <span />}
                {this.state.expanded && (
                    <blockquote className="helpText">{this.props.helpText}</blockquote>
                )}
            </>
        );
    }
}
