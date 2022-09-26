import React from 'react';
import { createRoot } from 'react-dom/client';
import GpxParser from 'gpxparser';

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
            const [mapComponent, gpxContents] = await Promise.all([
                import('./components/MapComponent'),
                file.text(),
            ]);
            const gpx = new GpxParser();
            gpx.parse(gpxContents);
            this.setState({
                isLoadingFile: false,
                gpxError: undefined,
                gpxInfo: {
                    distance: gpx.tracks[0].distance,
                    points: gpx.tracks[0].points,
                    name: gpx.tracks[0].name,
                    sizeBytes: gpxContents.length,
                },
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
