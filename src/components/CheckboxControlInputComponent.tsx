import React from 'react';
import LabelInputWithHelp from './LabelInputWithHelp';

type Props = {
    labelText: string;
    defaultChecked: boolean;
    helpText: string;
    onChange: (checked: boolean) => unknown;
};

export default function CheckboxControlInputComponent(props: Props) {
    const { labelText, defaultChecked, helpText, onChange } = props;
    return (
        <LabelInputWithHelp
            label={<label>{labelText}</label>}
            input={
                <input
                    type="checkbox"
                    defaultChecked={defaultChecked}
                    onChange={(evt) => onChange(evt.target.checked)}
                    style={{ maxWidth: '32px' }}
                />
            }
            helpText={helpText}
        />
    );
}
