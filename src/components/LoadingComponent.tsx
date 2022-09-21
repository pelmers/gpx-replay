import React from 'react';

type Props = {
    message: string;
};

export default class LoadingComponent extends React.Component<Props, {}> {
    render() {
        return (
            <div className="center">
                <div className="loading-spinner"></div>
                <div className="loading-spinner-progress-text">
                    {this.props.message}
                </div>
            </div>
        );
    }
}
