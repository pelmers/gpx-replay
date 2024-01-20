import React from 'react';
import CheckboxControlInputComponent from './CheckboxControlInputComponent';
import RangeSliderComponent from './RangeSliderComponent';

type Props = {
    onGpxLoad: (gpxFile: File, smoothingFactor: number, joinTracks: boolean) => unknown;
};

type State = {
    smoothingFactor: number;
    joinTracks: boolean;
};

export default class LoadGpxComponent extends React.Component<Props, State> {
    gpxInputRef = React.createRef<HTMLInputElement>();

    state = {
        smoothingFactor: 1.0,
        joinTracks: false,
    };
    // TODO: speed-sensitive option, instead of scaling playback rate to always 1 minute https://github.com/pelmers/gpx-replay/issues/8

    render() {
        const gpsSmoothingHelpEssay = `Smoothing GPS data means removing points that are close together.
            Higher smoothing factor: remove more points. At 0, no points are removed.
            Removing points helps deal with noise in the GPS data.
            The exact number of points is not known in advance;
            it's calculated based on multiplying the smoothing factor with the median distance in the data.
            Consecutive points closer than this distance are merged until they exceed it.`;

        const joinTracksHelpText = `If there are multiple tracks in the GPX file,
            then join them together. Otherwise, only show the first one.
            Note that most files only have one track.`;

        const handleFiles = (files: FileList) =>
            this.props.onGpxLoad(
                files[0],
                this.state.smoothingFactor,
                this.state.joinTracks
            );
        return (
            <div className="center">
                <h4 id="gpx-step-header">Load GPX file</h4>
                <div id="gpx-step-contents">
                    <div>
                        <button
                            id="gpx-button"
                            onClick={() => this.gpxInputRef.current!.click()}
                        >
                            Select
                        </button>
                        <input
                            type="file"
                            id="gpx-input"
                            accept=".gpx"
                            ref={this.gpxInputRef}
                            onChange={() =>
                                handleFiles(this.gpxInputRef.current!.files!)
                            }
                        />
                    </div>
                    <div
                        id="gpx-dragdrop"
                        onClick={() => this.gpxInputRef.current!.click()}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            (e.target as Element).classList.remove('dragEnter');
                            handleFiles(e.dataTransfer!.files);
                        }}
                        onDragEnter={(e) => {
                            (e.target as Element).classList.add('dragEnter');
                        }}
                        onDragExit={(e) => {
                            (e.target as Element).classList.remove('dragEnter');
                        }}
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                    >
                        Or drag and drop here
                    </div>
                </div>
                <div className="control-group">
                    <RangeSliderComponent
                        label="GPS Smoothing"
                        min={0.0}
                        max={100}
                        step={0.1}
                        value={this.state.smoothingFactor}
                        helpText={gpsSmoothingHelpEssay}
                        onChange={(value) => this.setState({ smoothingFactor: value })}
                    />
                    <CheckboxControlInputComponent
                        labelText="Join Tracks"
                        defaultChecked={this.state.joinTracks}
                        helpText={joinTracksHelpText}
                        onChange={(checked) => this.setState({ joinTracks: checked })}
                    />
                </div>
            </div>
        );
    }
}
