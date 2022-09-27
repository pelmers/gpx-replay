"use strict";
(self["webpackChunk"] = self["webpackChunk"] || []).push([["components_MapComponent_tsx"],{

/***/ "./components/MapComponent.tsx":
/*!*************************************!*\
  !*** ./components/MapComponent.tsx ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ MapComponent)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "../node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _mapboxApiKey__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../mapboxApiKey */ "./mapboxApiKey.ts");
/* harmony import */ var _mapTools__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../mapTools */ "./mapTools.ts");
/* harmony import */ var mapbox_gl__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! mapbox-gl */ "../node_modules/mapbox-gl/dist/mapbox-gl.js");
/* harmony import */ var mapbox_gl__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(mapbox_gl__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _turf_turf__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @turf/turf */ "../node_modules/@turf/turf/dist/es/index.js");
/* harmony import */ var _RangeSliderComponent__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./RangeSliderComponent */ "./components/RangeSliderComponent.tsx");
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};






class MapComponent extends (react__WEBPACK_IMPORTED_MODULE_0___default().Component) {
    constructor(props) {
        super(props);
        this.mapDivRef = react__WEBPACK_IMPORTED_MODULE_0___default().createRef();
        this.progressRef = react__WEBPACK_IMPORTED_MODULE_0___default().createRef();
        // where is the bike along the track? can be fractional, in the range [0, # points]
        // TODO: can i put this number in the state?
        this.playhead = 0;
        this.lastAnimationTime = null;
        this.point = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'Point',
                        coordinates: [0, 0],
                    },
                },
            ],
        };
        this.animationLoop = (t) => {
            if (!this.state.isPlaying) {
                this.animationHandle = requestAnimationFrame(this.animationLoop);
                this.lastAnimationTime = null;
                return;
            }
            else if (this.lastAnimationTime == null) {
                this.animationHandle = requestAnimationFrame(this.animationLoop);
                this.lastAnimationTime = t;
                return;
            }
            // cap at 120 fps
            const minAnimationTime = 1000 / 40;
            if (t - this.lastAnimationTime > minAnimationTime) {
                this.animationBody(t - this.lastAnimationTime);
                this.lastAnimationTime = t;
            }
            this.animationHandle = requestAnimationFrame(this.animationLoop);
        };
        this.windowSpaceBind = (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                e.stopPropagation();
                this.setState({ isPlaying: !this.state.isPlaying });
            }
        };
        this.handleProgressClick = (evt) => {
            let offsetFraction = evt.nativeEvent.offsetX / this.progressRef.current.offsetWidth;
            offsetFraction = Math.max(offsetFraction, 0);
            offsetFraction = Math.min(offsetFraction, 1);
            const newPosition = this.props.gpxInfo.points.length * offsetFraction;
            this.updatePointPosition(newPosition, 0);
            this.playhead = newPosition;
        };
        this.state = {
            useFollowCam: false,
            followSensitivity: 45,
            useFollowTrack: false,
            // mapStyle: 'mapbox://styles/pelmers/cl8ilg939000u15o5hxcr1mjy',
            mapStyle: 'mapbox://styles/mapbox/outdoors-v11',
            // divide by 60 seconds per minute
            pointsPerSecond: props.gpxInfo.points.length / 60,
            isPlaying: false,
            playbackRate: 1,
            gpxTrackWidth: 4,
            gpxTrackColor: '#ffff00',
            pointIcon: 'bicycle-15',
            pointIconSize: 2,
        };
        const origin = (0,_mapTools__WEBPACK_IMPORTED_MODULE_2__.toGeoJson)(props.gpxInfo.points[0]);
        this.point.features[0].geometry.coordinates = origin;
    }
    animationBody(timeDeltaMs) {
        // Note: times are in milliseconds.
        const timeDeltaS = timeDeltaMs / 1000;
        // Compute how many frames to advance the playhead based on the time difference and playback rate
        const moveDelta = timeDeltaS * this.state.playbackRate * this.state.pointsPerSecond;
        const { points } = this.props.gpxInfo;
        const newPosition = Math.min(moveDelta + this.playhead, points.length - 1);
        this.updatePointPosition(newPosition, timeDeltaS);
        // We've reached the end, pause the playback indicator
        if (newPosition === points.length - 1) {
            this.setState({ isPlaying: false });
        }
        this.playhead = newPosition;
    }
    interpolatePoint(position) {
        const { points } = this.props.gpxInfo;
        const pointIndex = Math.floor(position);
        const currentFrameFeature = (0,_mapTools__WEBPACK_IMPORTED_MODULE_2__.toGeoJsonFeature)(points[pointIndex]);
        const nextFrameFeature = (0,_mapTools__WEBPACK_IMPORTED_MODULE_2__.toGeoJsonFeature)(points[pointIndex + 1]);
        const nextDist = _turf_turf__WEBPACK_IMPORTED_MODULE_4__.distance(currentFrameFeature, nextFrameFeature);
        const bearing = _turf_turf__WEBPACK_IMPORTED_MODULE_4__.bearing(currentFrameFeature, nextFrameFeature);
        return {
            point: _turf_turf__WEBPACK_IMPORTED_MODULE_4__.along((0,_mapTools__WEBPACK_IMPORTED_MODULE_2__.toGeoJsonLineString)(points[pointIndex], points[pointIndex + 1]), nextDist * (position - pointIndex)),
            bearing,
        };
    }
    updatePointPosition(newPosition, timeDeltaS) {
        const { points } = this.props.gpxInfo;
        const pointIndex = Math.floor(newPosition);
        if (pointIndex === points.length - 1) {
            this.point.features[0] = (0,_mapTools__WEBPACK_IMPORTED_MODULE_2__.toGeoJsonFeature)(points[pointIndex]);
            return;
        }
        const { point, bearing } = this.interpolatePoint(newPosition);
        // TODO: fix a bit of stuttering issue (noticeable in followcam)
        // @ts-ignore it's okay this is fine
        this.point.features[0] = point;
        this.point.features[0].properties.bearing = bearing;
        this.map.getSource('point').setData(this.point);
        // Update progress bar percentage based on this position
        if (this.progressRef.current != null) {
            this.progressRef.current.value = (100 * newPosition) / (points.length - 1);
        }
        if (this.state.useFollowCam) {
            const rot = (0,_mapTools__WEBPACK_IMPORTED_MODULE_2__.bearingDiff)(this.map.getBearing(), bearing);
            // Cap the camera rotation rate at 30 degrees/second to prevent dizziness
            // After adding the rotation, reset domain to [-180, 180]
            // because moving from +170 to -170 is +20, which goes to 190, and out of bounds.
            const changeCap = this.state.followSensitivity * timeDeltaS;
            const fixedBearing = (0,_mapTools__WEBPACK_IMPORTED_MODULE_2__.fixBearingDomain)(this.map.getBearing() + (0,_mapTools__WEBPACK_IMPORTED_MODULE_2__.clamp)(rot, -changeCap, changeCap));
            const center = point.geometry.coordinates;
            this.map.easeTo({
                // @ts-ignore bug in typings
                center,
                bearing: fixedBearing,
                duration: timeDeltaS * 1000,
                // Linear move speed
                easing: (x) => x,
            });
        }
        if (this.state.useFollowTrack) {
            this.updateTrackDisplay(newPosition);
        }
    }
    updateTrackDisplay(position) {
        const pointIndex = Math.floor(position);
        const { points } = this.props.gpxInfo;
        if (pointIndex === points.length - 1) {
            const source = this.map.getSource('gpxTrack');
            source.setData((0,_mapTools__WEBPACK_IMPORTED_MODULE_2__.pointsToGeoJsonFeature)(points).data);
        }
        else {
            const sliceToPlayhead = points.slice(0, pointIndex + 1);
            sliceToPlayhead.push((0,_mapTools__WEBPACK_IMPORTED_MODULE_2__.geoJsonToPoint)(this.interpolatePoint(position).point));
            const source = this.map.getSource('gpxTrack');
            // TODO: this seems to lag with followcam and lots of points?
            source.setData((0,_mapTools__WEBPACK_IMPORTED_MODULE_2__.pointsToGeoJsonFeature)(sliceToPlayhead).data);
        }
    }
    componentWillUnmount() {
        if (this.animationHandle != null) {
            cancelAnimationFrame(this.animationHandle);
        }
        if (this.props.bindSpace) {
            window.removeEventListener('keydown', this.windowSpaceBind);
        }
    }
    componentDidMount() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.createMapFromState(this.state);
            if (this.props.bindSpace) {
                // Bind window space to play/pause
                window.addEventListener('keydown', this.windowSpaceBind);
            }
        });
    }
    createMapFromState(state) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.animationHandle != null) {
                cancelAnimationFrame(this.animationHandle);
            }
            const gpsPoints = this.props.gpxInfo.points;
            if (this.map == null) {
                this.map = new (mapbox_gl__WEBPACK_IMPORTED_MODULE_3___default().Map)({
                    container: this.mapDivRef.current,
                    zoom: 16,
                    pitch: 0,
                    center: (0,_mapTools__WEBPACK_IMPORTED_MODULE_2__.findCenter)(gpsPoints),
                    style: state.mapStyle,
                    accessToken: _mapboxApiKey__WEBPACK_IMPORTED_MODULE_1__.MAPBOX_API_KEY,
                });
                this.map.fitBounds((0,_mapTools__WEBPACK_IMPORTED_MODULE_2__.findBounds)(gpsPoints));
            }
            else {
                // If we have already loaded the map, just set the style. Otherwise it's billable
                this.map.setStyle(state.mapStyle);
            }
            const addSource = (id, points, params) => {
                this.map.addSource(id, (0,_mapTools__WEBPACK_IMPORTED_MODULE_2__.pointsToGeoJsonFeature)(points)).addLayer({
                    id,
                    type: 'line',
                    source: id,
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round',
                    },
                    paint: params,
                });
            };
            yield new Promise((resolve) => {
                this.map.once('styledata', () => {
                    addSource('gpxTrack', gpsPoints, {
                        'line-color': state.gpxTrackColor,
                        'line-width': state.gpxTrackWidth,
                    });
                    this.map.addSource('point', {
                        type: 'geojson',
                        data: this.point,
                    });
                    this.map.addLayer({
                        id: 'point',
                        source: 'point',
                        type: 'symbol',
                        layout: {
                            'icon-image': state.pointIcon,
                            'icon-size': state.pointIconSize,
                            'icon-allow-overlap': true,
                            'icon-ignore-placement': true,
                        },
                    });
                    if (this.state.useFollowTrack) {
                        this.updateTrackDisplay(this.playhead);
                    }
                    resolve();
                });
            });
            requestAnimationFrame(this.animationLoop);
        });
    }
    componentWillUpdate(props, nextState) {
        return __awaiter(this, void 0, void 0, function* () {
            // Did we toggle followcam?
            if (nextState.useFollowCam !== this.state.useFollowCam) {
                // Then update the camera on the map
                if (nextState.useFollowCam) {
                    this.map.easeTo({
                        zoom: 14.5,
                        pitch: 60,
                        center: (0,_mapTools__WEBPACK_IMPORTED_MODULE_2__.toGeoJson)(props.gpxInfo.points[Math.floor(this.playhead)]),
                    });
                }
                else {
                    this.map.easeTo({
                        pitch: 0,
                        center: (0,_mapTools__WEBPACK_IMPORTED_MODULE_2__.findCenter)(props.gpxInfo.points),
                        animate: false,
                        bearing: 0,
                    });
                    this.map.fitBounds((0,_mapTools__WEBPACK_IMPORTED_MODULE_2__.findBounds)(props.gpxInfo.points));
                }
            }
            if (nextState.useFollowTrack) {
                this.updateTrackDisplay(this.playhead);
            }
            else {
                this.updateTrackDisplay(props.gpxInfo.points.length - 1);
            }
            if (nextState.mapStyle !== this.state.mapStyle) {
                // Changing the style also resets the track and stuff, just re-create it.
                yield this.createMapFromState(nextState);
            }
            if (nextState.pointIcon !== this.state.pointIcon) {
                this.map.setLayoutProperty('point', 'icon-image', nextState.pointIcon);
            }
            if (nextState.pointIconSize !== this.state.pointIconSize) {
                this.map.setLayoutProperty('point', 'icon-size', nextState.pointIconSize);
            }
            if (nextState.gpxTrackColor !== this.state.gpxTrackColor) {
                this.map.setPaintProperty('gpxTrack', 'line-color', nextState.gpxTrackColor);
            }
            if (nextState.gpxTrackWidth !== this.state.gpxTrackWidth) {
                this.map.setPaintProperty('gpxTrack', 'line-width', nextState.gpxTrackWidth);
            }
        });
    }
    render() {
        // TODO bonus: elevation profile?
        const mb = this.props.gpxInfo.sizeBytes / 1000000;
        return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement((react__WEBPACK_IMPORTED_MODULE_0___default().Fragment), null,
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "center gpx-info" },
                "Selected: ",
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("b", null, this.props.gpxInfo.name),
                " (",
                mb.toFixed(2),
                " MB)"),
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "map-container-container" },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { id: "map-container", ref: this.mapDivRef })),
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "center" },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "progress-container" },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", { "aria-label": "Play", role: "button", className: "play-button", onClick: () => this.setState({ isPlaying: !this.state.isPlaying }) }, this.state.isPlaying ? '❚❚' : '►'),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("progress", { max: "100", value: "0", className: "play-progress", ref: this.progressRef, onClick: this.handleProgressClick }, "Progress"),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", { className: "fullscreen-button", onClick: () => {
                            this.mapDivRef.current.requestFullscreen();
                        } }, "Fullscreen"))),
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "center first-control-group" },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", null, "FollowCam"),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("input", { type: "checkbox", defaultChecked: this.state.useFollowCam, onChange: () => this.setState({ useFollowCam: !this.state.useFollowCam }) }),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", null, "FollowTrack"),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("input", { type: "checkbox", defaultChecked: this.state.useFollowTrack, onChange: () => this.setState({
                        useFollowTrack: !this.state.useFollowTrack,
                    }) })),
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "center control-group" },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_RangeSliderComponent__WEBPACK_IMPORTED_MODULE_5__["default"], { label: "Follow Sensitivity", min: 0, max: 180, step: 1, value: this.state.followSensitivity, onChange: (v) => this.setState({ followSensitivity: v }) }),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_RangeSliderComponent__WEBPACK_IMPORTED_MODULE_5__["default"], { label: 'Playback Rate', min: 0.2, max: 20, step: 0.2, value: this.state.playbackRate, onChange: (value) => this.setState({ playbackRate: value }) })),
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "center control-group" },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", { htmlFor: "map-style" }, "Map Style"),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("select", { name: "map style", onChange: (evt) => {
                        this.setState({ mapStyle: evt.target.value });
                    }, defaultValue: this.state.mapStyle },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", { value: "mapbox://styles/mapbox/outdoors-v11" }, "Outdoors"),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", { value: "mapbox://styles/mapbox/streets-v11" }, "Streets"),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", { value: "mapbox://styles/mapbox/light-v10" }, "Light"),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", { value: "mapbox://styles/mapbox/dark-v10" }, "Dark"),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", { value: "mapbox://styles/mapbox/satellite-v9" }, "Satellite"),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", { value: "mapbox://styles/mapbox/satellite-streets-v11" }, "Satellite Streets"),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", { value: "mapbox://styles/mapbox/navigation-day-v1" }, "Navigation Day"),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", { value: "mapbox://styles/mapbox/navigation-night-v1" }, "Navigation Night")),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", null, "Point Icon"),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("select", { defaultValue: this.state.pointIcon, onChange: (evt) => {
                        this.setState({ pointIcon: evt.target.value });
                    } },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", { value: "bicycle-15" }, "Bicycle"),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", { value: "rocket-15" }, "Rocket"),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", { value: "swimming-15" }, "Swimmer"),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", { value: "bus-15" }, "Bus"),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", { value: "rail-15" }, "Train"),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", { value: "pitch-15" }, "Runner"),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", { value: "car-15" }, "Death Cage"),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("option", { value: "circle-15" }, "Circle")),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_RangeSliderComponent__WEBPACK_IMPORTED_MODULE_5__["default"], { label: 'Point Icon Size', min: 0.0, max: 25, step: 0.5, value: this.state.pointIconSize, onChange: (value) => this.setState({ pointIconSize: value }) }),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", { htmlFor: "line-color" }, "Line Color"),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("input", { type: "color", name: "line-color", defaultValue: this.state.gpxTrackColor, onChange: (ev) => {
                        this.setState({ gpxTrackColor: ev.target.value });
                    } }),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_RangeSliderComponent__WEBPACK_IMPORTED_MODULE_5__["default"], { label: 'Line Thickness', min: 0.0, max: 30, step: 0.5, value: this.state.gpxTrackWidth, onChange: (value) => this.setState({ gpxTrackWidth: value }) }))));
    }
}


/***/ }),

/***/ "./components/RangeSliderComponent.tsx":
/*!*********************************************!*\
  !*** ./components/RangeSliderComponent.tsx ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ RangeSliderComponent)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "../node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
// React component that renders a range slider with a label and callback on change

class RangeSliderComponent extends (react__WEBPACK_IMPORTED_MODULE_0___default().Component) {
    render() {
        return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement((react__WEBPACK_IMPORTED_MODULE_0___default().Fragment), null,
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", null, this.props.label),
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { style: { display: 'inline' } },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", { style: { marginRight: '25px' } }, this.props.value.toFixed(1)),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("input", { type: "range", min: this.props.min, max: this.props.max, step: this.props.step, value: this.props.value, onChange: (e) => this.props.onChange(Number(e.target.value)) }))));
    }
}


/***/ }),

/***/ "./mapTools.ts":
/*!*********************!*\
  !*** ./mapTools.ts ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "bearingDiff": () => (/* binding */ bearingDiff),
/* harmony export */   "clamp": () => (/* binding */ clamp),
/* harmony export */   "findBounds": () => (/* binding */ findBounds),
/* harmony export */   "findCenter": () => (/* binding */ findCenter),
/* harmony export */   "fixBearingDomain": () => (/* binding */ fixBearingDomain),
/* harmony export */   "geoJsonToPoint": () => (/* binding */ geoJsonToPoint),
/* harmony export */   "pointsToGeoJsonFeature": () => (/* binding */ pointsToGeoJsonFeature),
/* harmony export */   "toGeoJson": () => (/* binding */ toGeoJson),
/* harmony export */   "toGeoJsonFeature": () => (/* binding */ toGeoJsonFeature),
/* harmony export */   "toGeoJsonLineString": () => (/* binding */ toGeoJsonLineString)
/* harmony export */ });
function toGeoJson(point) {
    return [point.lon, point.lat];
}
function pointsToGeoJsonFeature(points) {
    return {
        type: 'geojson',
        data: {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates: points.map(toGeoJson),
            },
        },
    };
}
function geoJsonToPoint(pt) {
    const { coordinates } = pt.geometry;
    return { lon: coordinates[0], lat: coordinates[1] };
}
function toGeoJsonFeature(point) {
    return {
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: toGeoJson(point),
        },
        properties: {},
    };
}
function toGeoJsonLineString(from, to) {
    return {
        type: 'Feature',
        geometry: {
            type: 'LineString',
            coordinates: [toGeoJson(from), toGeoJson(to)],
        },
        properties: {},
    };
}
function findCenter(gpsPoints) {
    const n = gpsPoints.length;
    const avg = gpsPoints.reduce((prev, cur) => ({
        lat: prev.lat + cur.lat / n,
        lon: prev.lon + cur.lon / n,
    }), { lat: 0, lon: 0 });
    return toGeoJson(avg);
}
function findBounds(gpsPoints) {
    const [sw, ne] = gpsPoints.reduce(([sw, ne], cur) => [
        {
            lat: Math.min(cur.lat, sw.lat),
            lng: Math.min(cur.lon, sw.lng),
        },
        { lat: Math.max(cur.lat, ne.lat), lng: Math.max(cur.lon, ne.lng) },
    ], [
        { lat: Number.MAX_SAFE_INTEGER, lng: Number.MAX_SAFE_INTEGER },
        { lat: Number.MIN_SAFE_INTEGER, lng: Number.MIN_SAFE_INTEGER },
    ]);
    // Add padding to every side
    const pad = 0.15;
    const x = (ne.lat - sw.lat) * pad;
    const y = (ne.lng - sw.lng) * pad;
    return [
        {
            lat: sw.lat - x,
            lng: sw.lng - y,
        },
        {
            lat: ne.lat + x,
            lng: ne.lng + y,
        },
    ];
}
const clamp = (num, lo, hi) => num < lo ? lo : num > hi ? hi : num;
// Given bearings a and b in the range [-180, 180], return the short angle that moves a to b.
// examples:
// if a is 10 and b is -10, then the answer is -20.
// if a is -10 and b is 10, then the answer is 20.
// if a is -170 and b is 170, then the answer is -20.
// if a is 170 and b is -170, then the answer is 20.
const bearingDiff = (a, b) => {
    // diff will be in the range [0, 360]
    const diff = Math.abs(b - a);
    const sign = b > a ? 1 : -1;
    return sign * (diff > 180 ? -(360 - diff) : diff);
};
// Fix a bearing between [-360, 360] to [-180, 180]
const fixBearingDomain = (b) => {
    if (b < -180) {
        return 360 + b;
    }
    else if (b > 180) {
        return -360 + b;
    }
    return b;
};


/***/ }),

/***/ "./mapboxApiKey.ts":
/*!*************************!*\
  !*** ./mapboxApiKey.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "MAPBOX_API_KEY": () => (/* binding */ MAPBOX_API_KEY)
/* harmony export */ });
const MAPBOX_API_KEY = 'pk.eyJ1IjoicGVsbWVycyIsImEiOiJjbDhrbjIyYnUwejhyM3ZyMDVlZnB2a3h6In0.M-JOZDdOSziLjIVuHLhXjw';


/***/ })

}]);
//# sourceMappingURL=components_MapComponent_tsx.bundle.js.map