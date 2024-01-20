import React from 'react';

import type { State, SetStateFunc } from './MapComponent';
import CheckboxControlInputComponent from './CheckboxControlInputComponent';
import LabelInputWithHelp from './LabelInputWithHelp';
import RangeSliderComponent from './RangeSliderComponent';

export function MapComponentOptions(props: {
    state: State;
    setState: SetStateFunc;
    showPlaybackRate: boolean;
}) {
    const { state, setState, showPlaybackRate } = props;
    return (
        <>
            <div className="center control-group">
                <CheckboxControlInputComponent
                    labelText="FollowCam"
                    defaultChecked={state.useFollowCam}
                    helpText="When checked, camera follows point during playback"
                    onChange={(checked) => setState({ useFollowCam: checked })}
                />
                <CheckboxControlInputComponent
                    labelText="FollowTrack"
                    defaultChecked={state.useFollowCam}
                    helpText="When checked, GPX track follows point during playback"
                    onChange={(checked) => setState({ useFollowTrack: checked })}
                />
            </div>
            <div className="center control-group">
                {state.useFollowCam && (
                    <RangeSliderComponent
                        label="Follow Sensitivity"
                        min={0}
                        max={180}
                        step={1}
                        helpText="In FollowCam, limits how quickly the camera can rotate, expressed in degrees per second. At 0 the camera direction will be fixed, so it will only pan."
                        value={state.followSensitivity}
                        onChange={(v) => setState({ followSensitivity: v })}
                    />
                )}
                {state.useFollowCam && (
                    <RangeSliderComponent
                        label="Follow Momentum"
                        min={0}
                        max={0.99}
                        step={0.01}
                        helpText="In FollowCam, adjusts the camera movement by continuing to pan in the direction of the last frame, scaled by this factor. So a factor of 0 means we move the map such that the track point is exactly in the center. A factor of 1 would mean we only move in the same direction as the last frame. The camera will move more smoothly but will not follow the exact point as closely."
                        value={state.followMomentum}
                        onChange={(v) => setState({ followMomentum: v })}
                    />
                )}

                {showPlaybackRate && (
                    <RangeSliderComponent
                        label={'Playback Rate'}
                        min={0.1}
                        max={20}
                        step={0.1}
                        value={state.playbackRate}
                        helpText="Multiplier for playback speed. Default playback speed is tuned so it finishes in exactly 60 seconds (regardless GPX track length)."
                        onChange={(value) => setState({ playbackRate: value })}
                    />
                )}
            </div>
            <div className="center control-group">
                {/* styles from https://docs.mapbox.com/api/maps/styles/ */}
                <label htmlFor="map-style">Map Style</label>
                <select
                    name="map style"
                    onChange={(evt) => {
                        // Also set isPlaying to false because changing the style reloads the map
                        // while the map is loading, the point and the track are not yet set
                        setState({
                            mapStyle: evt.target.value,
                            isPlaying: false,
                        });
                    }}
                    defaultValue={state.mapStyle}
                >
                    <option value="mapbox://styles/mapbox/outdoors-v11">
                        Outdoors
                    </option>
                    <option value="mapbox://styles/mapbox/streets-v11">Streets</option>
                    <option value="mapbox://styles/mapbox/light-v10">Light</option>
                    <option value="mapbox://styles/mapbox/dark-v10">Dark</option>
                    <option value="mapbox://styles/mapbox/satellite-v9">
                        Satellite
                    </option>
                    <option value="mapbox://styles/mapbox/satellite-streets-v11">
                        Satellite Streets
                    </option>
                    <option value="mapbox://styles/mapbox/navigation-day-v1">
                        Navigation Day
                    </option>
                    <option value="mapbox://styles/mapbox/navigation-night-v1">
                        Navigation Night
                    </option>
                    <option value="mapbox://styles/pelmers/cl8ilg939000u15o5hxcr1mjy">
                        Peter Custom Satellite
                    </option>
                    <option value="mapbox://styles/pelmers/cljn0kxxr00ct01qwgdcgblzs">
                        peter.travel
                    </option>
                </select>

                <CheckboxControlInputComponent
                    labelText="3D Topography"
                    defaultChecked={state.showTopo}
                    helpText="When checked, an extra layer of topographic terrain is added to the map to emphasize elevation. This is more visible in FollowCam."
                    onChange={(checked) => setState({ showTopo: checked })}
                />

                {/* List available at https://github.com/mapbox/mapbox-gl-styles#standard-icons  */}
                <LabelInputWithHelp
                    label={<label>Point Icon</label>}
                    input={
                        <select
                            defaultValue={state.pointIcon}
                            onChange={(evt) => {
                                setState({ pointIcon: evt.target.value });
                            }}
                        >
                            <option value="bicycle-15">Bicycle</option>
                            <option value="rocket-15">Rocket</option>
                            <option value="swimming-15">Swimmer</option>
                            <option value="bus-15">Bus</option>
                            <option value="rail-15">Train</option>
                            <option value="pitch-15">Runner</option>
                            <option value="car-15">Death Cage</option>
                            <option value="circle-15">Circle</option>
                        </select>
                    }
                    helpText={
                        'Icon to use for the point. Note: not all styles support every icon. If you have a specific request please file an issue. (Or better yet, submit a fix!)'
                    }
                />

                <RangeSliderComponent
                    label={'Point Icon Size'}
                    min={0.0}
                    max={25}
                    step={0.5}
                    value={state.pointIconSize}
                    onChange={(value) => setState({ pointIconSize: value })}
                />

                <label htmlFor="line-color">Line Color</label>
                <input
                    type="color"
                    name="line-color"
                    defaultValue={state.gpxTrackColor}
                    onChange={(ev) => {
                        setState({ gpxTrackColor: ev.target.value });
                    }}
                />

                <RangeSliderComponent
                    label={'Line Thickness'}
                    min={0.0}
                    max={30}
                    step={0.5}
                    value={state.gpxTrackWidth}
                    onChange={(value) => setState({ gpxTrackWidth: value })}
                />
            </div>
        </>
    );
}
