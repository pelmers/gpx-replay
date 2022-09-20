import React from 'react';

type Props = {
    onGpxLoad: (gpxFile: File) => unknown;
};

export default class LoadGpxComponent extends React.Component<Props, {}> {
    gpxInputRef = React.createRef<HTMLInputElement>();

    render() {
        const handleFiles = (files: FileList) => this.props.onGpxLoad(files[0]);
        return (
            <>
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
            </>
        );
    }
}
