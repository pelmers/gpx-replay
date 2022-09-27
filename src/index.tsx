import React from 'react';
import { createRoot } from 'react-dom/client';

import ErrorComponent from './components/ErrorComponent';
import LoadGpxComponent from './components/LoadGpxComponent';
import LoadingComponent from './components/LoadingComponent';
import { GpxInfo } from './types';

type State = {
    gpxInfo?: GpxInfo;
    gpxError?: string;
    isLoadingFile?: boolean;
    mapComponent?: typeof React.Component;
};

class App extends React.Component<{}, State> {
    state: State = {};

    onFileAdded = async (file: File) => {
        this.setState({ isLoadingFile: true });
        try {
            // Import the map component async so the bundle can be split
            const [mapComponent, gpxContents, gpxParse] = await Promise.all([
                import('./components/MapComponent'),
                file.text(),
                import('./gpxParsing'),
            ]);
            // TODO: for smoothness, massage the gpx speed by merging points in the bottom 10% of speed
            this.setState({
                isLoadingFile: false,
                gpxError: undefined,
                gpxInfo: gpxParse.default(gpxContents),
                mapComponent: mapComponent.default,
            });
        } catch (e) {
            this.setState({
                isLoadingFile: false,
                gpxError: e.message,
            });
        }
    };

    render() {
        if (this.state.isLoadingFile) {
            return <LoadingComponent message={'Processing selected file'} />;
        } else if (this.state.gpxError != null) {
            return (
                <>
                    <ErrorComponent message={this.state.gpxError} />
                    <LoadGpxComponent onGpxLoad={this.onFileAdded} />
                </>
            );
        } else if (this.state.gpxInfo != null && this.state.mapComponent != null) {
            return <this.state.mapComponent gpxInfo={this.state.gpxInfo} />;
        } else {
            return <LoadGpxComponent onGpxLoad={this.onFileAdded} />;
        }
    }
}

const root = createRoot(document.getElementById('react-root')!);
root.render(<App />);
