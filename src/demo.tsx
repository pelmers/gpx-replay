import React from 'react';
import { createRoot } from 'react-dom/client';

import { MAPBOX_API_KEY } from './mapboxApiKey';

import ErrorComponent from './components/ErrorComponent';
import LoadGpxComponent from './components/LoadGpxComponent';
import LoadingComponent from './components/LoadingComponent';
import { GpxInfo } from './types';

import '../static/map.css';

type State = {
    gpxInfo?: GpxInfo;
    gpxError?: string;
    isLoadingFile?: boolean;
    mapComponent?: typeof import('./components/MapComponent').default;
};

class App extends React.Component<{}, State> {
    state: State = {};

    onFileAdded = async (file: File, smoothingFactor: number, joinTracks: boolean) => {
        this.setState({ isLoadingFile: true });
        try {
            // Import the map component async so the bundle can be split
            const [mapComponent, gpxContents, gpxParse] = await Promise.all([
                import('./components/MapComponent'),
                file.text(),
                import('./gpxParsing'),
            ]);
            this.setState({
                isLoadingFile: false,
                gpxError: undefined,
                gpxInfo: gpxParse.default(gpxContents, smoothingFactor, joinTracks),
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
            return (
                <this.state.mapComponent
                    gpxInfo={this.state.gpxInfo}
                    bindKeys={true}
                    mapboxAccessToken={MAPBOX_API_KEY}
                    playbackFPS={40}
                    showElevationProfile
                />
            );
        } else {
            return <LoadGpxComponent onGpxLoad={this.onFileAdded} />;
        }
    }
}

const root = createRoot(document.getElementById('react-root')!);
root.render(<App />);
