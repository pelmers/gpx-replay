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
            if (this.lastAnimationTime != null) {
                this.animationBody(t - this.lastAnimationTime);
            }
            this.lastAnimationTime = t;
            this.animationHandle = requestAnimationFrame(this.animationLoop);
        };
        this.state = {
            useFollowCam: true,
            // mapStyle: 'mapbox://styles/pelmers/cl8ilg939000u15o5hxcr1mjy',
            mapStyle: 'mapbox://styles/mapbox/outdoors-v11',
            // divide by 60 seconds per minute
            pointsPerSecond: props.gpxInfo.points.length / 60,
            isPlaying: false,
            playbackRate: 5,
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
        this.updatePointPosition(newPosition);
        // We've reached the end, pause the playback indicator
        if (newPosition === points.length - 1) {
            this.setState({ isPlaying: false });
        }
        this.playhead = newPosition;
    }
    updatePointPosition(newPosition) {
        const { points } = this.props.gpxInfo;
        const currentFrameFeature = (0,_map__WEBPACK_IMPORTED_MODULE_2__.toGeoJsonFeature)(points[Math.floor(this.playhead)]);
        const nextFrameFeature = (0,_map__WEBPACK_IMPORTED_MODULE_2__.toGeoJsonFeature)(points[Math.floor(newPosition)]);
        const nextBearing = _turf_turf__WEBPACK_IMPORTED_MODULE_4__.bearing(currentFrameFeature, nextFrameFeature);
        const nextDist = _turf_turf__WEBPACK_IMPORTED_MODULE_4__.distance(currentFrameFeature, nextFrameFeature);
        const interpPoint = _turf_turf__WEBPACK_IMPORTED_MODULE_4__.along((0,_map__WEBPACK_IMPORTED_MODULE_2__.toGeoJsonLineString)(points[Math.floor(this.playhead)], points[Math.floor(newPosition)]), nextDist * (newPosition - this.playhead) +
            (this.playhead - Math.floor(this.playhead)));
        // @ts-ignore it's okay this is fine
        this.point.features[0] = interpPoint;
        this.point.features[0].properties.bearing = nextBearing;
        this.map.getSource('point').setData(this.point);
        // TODO: if follow mode update camera
        // TODO: set new state on the progress bar
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
                this.map
                    .addSource(id, {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'LineString',
                            coordinates: points.map(_map__WEBPACK_IMPORTED_MODULE_2__.toGeoJson),
                        },
                    },
                })
                    .addLayer({
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
                        // TODO: let user pick color/width?
                        'line-color': '#ff0',
                        'line-width': 4,
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
                            // TODO: allow customize the icon
                            'icon-image': 'bicycle-15',
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
    render() {
        // TODO outline:
        // 1. map itself
        // 2. scrubbable progress bar, and playback rate (also slider?)
        // 3. followcam toggle
        // 4. inputs for the different options:
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
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("progress", { max: "100", value: "0", className: "play-progress", ref: this.progressRef }, "Progress")))));
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
/* harmony export */   "toGeoJson": () => (/* binding */ toGeoJson),
/* harmony export */   "toGeoJsonFeature": () => (/* binding */ toGeoJsonFeature),
/* harmony export */   "toGeoJsonLineString": () => (/* binding */ toGeoJsonLineString)
/* harmony export */ });
function toGeoJson(point) {
    return [point.lon, point.lat];
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