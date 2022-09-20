import React from 'react';

type Props = {
    message: string;
};

export default class LoadingComponent extends React.Component<Props, {}> {
    render() {
        return (
            <>
                <div id="loading-spinner"></div>
                <div id="loading-spinner-progress-text">{this.props.message}</div>
            </>
        );
    }
}
