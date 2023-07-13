import React from 'react';

// @ts-ignore svg loading handled by svgr
import PlayButtonSVG from './svg/play_btn.svg';
// @ts-ignore svg loading handled by svgr
import PauseButtonSVG from './svg/pause_btn.svg';

export function MapComponentProgress(props: {
    onPlayClick: React.MouseEventHandler;
    onProgressClick: React.MouseEventHandler;
    isPlaying: boolean;
    progressRef: React.Ref<HTMLProgressElement>;
}) {
    return (
        <div className="center">
            <div className="progress-container">
                <button
                    aria-label="Play"
                    role="button"
                    className="play-button"
                    onClick={props.onPlayClick}
                >
                    {props.isPlaying ? <PauseButtonSVG /> : <PlayButtonSVG />}
                </button>
                <progress
                    max="100"
                    value="0"
                    className="play-progress"
                    ref={props.progressRef}
                    onClick={props.onProgressClick}
                >
                    Progress
                </progress>
            </div>
        </div>
    );
}

