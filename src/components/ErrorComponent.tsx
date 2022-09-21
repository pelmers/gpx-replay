import React from 'react';

type Props = {
    message: string;
};

export default class ErrorComponent extends React.Component<Props, {}> {
    render() {
        return <div className="errorMessage center">Error: {this.props.message}</div>;
    }
}
