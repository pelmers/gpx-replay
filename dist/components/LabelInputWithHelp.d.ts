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
    state: {
        expanded: boolean;
    };
    render(): JSX.Element;
}
export {};
