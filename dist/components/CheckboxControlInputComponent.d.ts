/// <reference types="react" />
declare type Props = {
    labelText: string;
    defaultChecked: boolean;
    helpText: string;
    onChange: (checked: boolean) => unknown;
};
export default function CheckboxControlInputComponent(props: Props): JSX.Element;
export {};
