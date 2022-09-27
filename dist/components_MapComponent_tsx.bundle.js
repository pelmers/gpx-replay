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
/* harmony import */ var _map__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../map */ "./map.ts");
/* harmony import */ var mapbox_gl__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! mapbox-gl */ "../node_modules/mapbox-gl/dist/mapbox-gl.js");
/* harmony import */ var mapbox_gl__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(mapbox_gl__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _turf_turf__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @turf/turf */ "../node_modules/@turf/turf/dist/es/index.js");
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};





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
            // cap at 60 fps
            const minAnimationTime = 16;
            if (this.lastAnimationTime != null &&
                t - this.lastAnimationTime > minAnimationTime) {
                this.animationBody(t - this.lastAnimationTime);
            }
            this.lastAnimationTime = t;
            this.animationHandle = requestAnimationFrame(this.animationLoop);
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
            useFollowTrack: false,
            // mapStyle: 'mapbox://styles/pelmers/cl8ilg939000u15o5hxcr1mjy',
            mapStyle: 'mapbox://styles/mapbox/outdoors-v11',
            // divide by 60 seconds per minute
            pointsPerSecond: props.gpxInfo.points.length / 60,
            isPlaying: false,
            playbackRate: 1,
            gpxTrackWidth: 4,
            gpxTrackColor: '#ff0',
            pointIcon: 'bicycle-15',
        };
        const origin = (0,_map__WEBPACK_IMPORTED_MODULE_2__.toGeoJson)(props.gpxInfo.points[0]);
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
        const currentFrameFeature = (0,_map__WEBPACK_IMPORTED_MODULE_2__.toGeoJsonFeature)(points[pointIndex]);
        const nextFrameFeature = (0,_map__WEBPACK_IMPORTED_MODULE_2__.toGeoJsonFeature)(points[pointIndex + 1]);
        const nextDist = _turf_turf__WEBPACK_IMPORTED_MODULE_4__.distance(currentFrameFeature, nextFrameFeature);
        const bearing = _turf_turf__WEBPACK_IMPORTED_MODULE_4__.bearing(currentFrameFeature, nextFrameFeature);
        return {
            point: _turf_turf__WEBPACK_IMPORTED_MODULE_4__.along((0,_map__WEBPACK_IMPORTED_MODULE_2__.toGeoJsonLineString)(points[pointIndex], points[pointIndex + 1]), nextDist * (position - pointIndex)),
            bearing,
        };
    }
    updatePointPosition(newPosition, timeDeltaS) {
        const { points } = this.props.gpxInfo;
        const pointIndex = Math.floor(newPosition);
        if (pointIndex === points.length - 1) {
            this.point.features[0] = (0,_map__WEBPACK_IMPORTED_MODULE_2__.toGeoJsonFeature)(points[pointIndex]);
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
            const rot = bearingDiff(this.map.getBearing(), bearing);
            // Cap the camera rotation rate at 90 degrees/second to prevent dizziness
            // After adding the rotation, reset domain to [-180, 180]
            // because moving from +170 to -170 is +20, which goes to 190, and out of bounds.
            const changeCap = 30 * timeDeltaS;
            const fixedBearing = fixBearingDomain(this.map.getBearing() + clamp(rot, -changeCap, changeCap));
            const center = point.geometry.coordinates;
            this.map.easeTo({
                // @ts-ignore bug in typings
                center,
                bearing: fixedBearing,
                duration: 0.9 * timeDeltaS * 1000,
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
            source.setData((0,_map__WEBPACK_IMPORTED_MODULE_2__.pointsToGeoJsonFeature)(points).data);
        }
        else {
            const sliceToPlayhead = points.slice(0, pointIndex + 1);
            sliceToPlayhead.push((0,_map__WEBPACK_IMPORTED_MODULE_2__.geoJsonToPoint)(this.interpolatePoint(position).point));
            const source = this.map.getSource('gpxTrack');
            // TODO: this seems to lag with followcam and lots of points?
            source.setData((0,_map__WEBPACK_IMPORTED_MODULE_2__.pointsToGeoJsonFeature)(sliceToPlayhead).data);
        }
    }
    componentWillUnmount() {
        if (this.animationHandle != null) {
            cancelAnimationFrame(this.animationHandle);
        }
    }
    componentDidMount() {
        return __awaiter(this, void 0, void 0, function* () {
            const gpsPoints = this.props.gpxInfo.points;
            this.map = new (mapbox_gl__WEBPACK_IMPORTED_MODULE_3___default().Map)({
                container: this.mapDivRef.current,
                zoom: 16,
                pitch: 0,
                center: (0,_map__WEBPACK_IMPORTED_MODULE_2__.findCenter)(gpsPoints),
                style: this.state.mapStyle,
                accessToken: _mapboxApiKey__WEBPACK_IMPORTED_MODULE_1__.MAPBOX_API_KEY,
            });
            this.map.fitBounds((0,_map__WEBPACK_IMPORTED_MODULE_2__.findBounds)(gpsPoints));
            const addSource = (id, points, params) => {
                this.map.addSource(id, (0,_map__WEBPACK_IMPORTED_MODULE_2__.pointsToGeoJsonFeature)(points)).addLayer({
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
                        'line-color': this.state.gpxTrackColor,
                        'line-width': this.state.gpxTrackWidth,
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
                            'icon-image': this.state.pointIcon,
                            'icon-size': 2,
                            'icon-allow-overlap': true,
                            'icon-ignore-placement': true,
                        },
                    });
                    resolve();
                });
            });
            requestAnimationFrame(this.animationLoop);
        });
    }
    componentWillUpdate(props, nextState) {
        // Did we toggle followcam?
        if (nextState.useFollowCam !== this.state.useFollowCam) {
            // Then update the camera on the map
            if (nextState.useFollowCam) {
                this.map.easeTo({
                    zoom: 14.5,
                    pitch: 60,
                    center: (0,_map__WEBPACK_IMPORTED_MODULE_2__.toGeoJson)(props.gpxInfo.points[Math.floor(this.playhead)]),
                });
            }
            else {
                this.map.easeTo({
                    pitch: 0,
                    center: (0,_map__WEBPACK_IMPORTED_MODULE_2__.findCenter)(props.gpxInfo.points),
                    animate: false,
                    bearing: 0,
                });
                this.map.fitBounds((0,_map__WEBPACK_IMPORTED_MODULE_2__.findBounds)(props.gpxInfo.points));
            }
        }
        if (nextState.useFollowTrack) {
            this.updateTrackDisplay(this.playhead);
        }
        else {
            this.updateTrackDisplay(props.gpxInfo.points.length - 1);
        }
    }
    render() {
        // TODO outline:
        // 1. map itself
        // 2. scrubbable progress bar, and playback rate (also slider?)
        // 3. followcam toggle
        // 4. draw route behind toggle
        // 5. inputs for the different options:
        //  - constant speed or given speed
        //  - map style
        //  - icon type, icon size
        //  - line color, line thickness
        // bonus:
        // - elevation profile?
        const mb = this.props.gpxInfo.sizeBytes / 1000000;
        return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement((react__WEBPACK_IMPORTED_MODULE_0___default().Fragment), null,
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "center gpx-info" },
                "Selected: ",
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("b", null, this.props.gpxInfo.name),
                " (",
                mb.toFixed(2),
                " MB)"),
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { id: "map-container", ref: this.mapDivRef }),
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "center" },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "progress-container" },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", { "aria-label": "Play", role: "button", className: "play-button", onClick: () => this.setState({ isPlaying: !this.state.isPlaying }) }, this.state.isPlaying ? '❚❚' : '►'),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", { className: "play-percent", role: "percentage indicator" }),
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("progress", { max: "100", value: "0", className: "play-progress", ref: this.progressRef, onClick: this.handleProgressClick }, "Progress"))),
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "center control-group" },
                "Use FollowCam",
                ' ',
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("input", { type: "checkbox", defaultChecked: this.state.useFollowCam, onChange: () => this.setState({ useFollowCam: !this.state.useFollowCam }) }),
                "Use FollowTrack",
                ' ',
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("input", { type: "checkbox", defaultChecked: this.state.useFollowTrack, onChange: () => this.setState({
                        useFollowTrack: !this.state.useFollowTrack,
                    }) }))));
    }
}


/***/ }),

/***/ "./map.ts":
/*!****************!*\
  !*** ./map.ts ***!
  \****************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "findBounds": () => (/* binding */ findBounds),
/* harmony export */   "findCenter": () => (/* binding */ findCenter),
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
const MAPBOX_API_KEY = 'pk.eyJ1IjoicGVsbWVycyIsImEiOiJjbDg5N2N5Nm0wMzU2M25qeHIzdjl5dm1pIn0.eIGsKaeGa_O7bELSprhD8A';


/***/ })

}]);
//# sourceMappingURL=components_MapComponent_tsx.bundle.js.map