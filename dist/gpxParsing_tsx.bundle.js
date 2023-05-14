(self["webpackChunk"] = self["webpackChunk"] || []).push([["gpxParsing_tsx"],{

/***/ "../node_modules/gpxparser/dist/GPXParser.min.js":
/*!*******************************************************!*\
  !*** ../node_modules/gpxparser/dist/GPXParser.min.js ***!
  \*******************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

let gpxParser=function(){this.xmlSource="",this.metadata={},this.waypoints=[],this.tracks=[],this.routes=[]};gpxParser.prototype.parse=function(e){let t=this,l=new window.DOMParser;this.xmlSource=l.parseFromString(e,"text/xml");let r=this.xmlSource.querySelector("metadata");if(null!=r){this.metadata.name=this.getElementValue(r,"name"),this.metadata.desc=this.getElementValue(r,"desc"),this.metadata.time=this.getElementValue(r,"time");let e={},t=r.querySelector("author");if(null!=t){e.name=this.getElementValue(t,"name"),e.email={};let l=t.querySelector("email");null!=l&&(e.email.id=l.getAttribute("id"),e.email.domain=l.getAttribute("domain"));let r={},a=t.querySelector("link");null!=a&&(r.href=a.getAttribute("href"),r.text=this.getElementValue(a,"text"),r.type=this.getElementValue(a,"type")),e.link=r}this.metadata.author=e;let l={},a=this.queryDirectSelector(r,"link");null!=a&&(l.href=a.getAttribute("href"),l.text=this.getElementValue(a,"text"),l.type=this.getElementValue(a,"type"),this.metadata.link=l)}var a=[].slice.call(this.xmlSource.querySelectorAll("wpt"));for(let e in a){var n=a[e];let l={};l.name=t.getElementValue(n,"name"),l.sym=t.getElementValue(n,"sym"),l.lat=parseFloat(n.getAttribute("lat")),l.lon=parseFloat(n.getAttribute("lon"));let r=parseFloat(t.getElementValue(n,"ele"));l.ele=isNaN(r)?null:r,l.cmt=t.getElementValue(n,"cmt"),l.desc=t.getElementValue(n,"desc");let i=t.getElementValue(n,"time");l.time=null==i?null:new Date(i),t.waypoints.push(l)}var i=[].slice.call(this.xmlSource.querySelectorAll("rte"));for(let e in i){let l=i[e],r={};r.name=t.getElementValue(l,"name"),r.cmt=t.getElementValue(l,"cmt"),r.desc=t.getElementValue(l,"desc"),r.src=t.getElementValue(l,"src"),r.number=t.getElementValue(l,"number");let a=t.queryDirectSelector(l,"type");r.type=null!=a?a.innerHTML:null;let n={},o=l.querySelector("link");null!=o&&(n.href=o.getAttribute("href"),n.text=t.getElementValue(o,"text"),n.type=t.getElementValue(o,"type")),r.link=n;let u=[];var s=[].slice.call(l.querySelectorAll("rtept"));for(let e in s){let l=s[e],r={};r.lat=parseFloat(l.getAttribute("lat")),r.lon=parseFloat(l.getAttribute("lon"));let a=parseFloat(t.getElementValue(l,"ele"));r.ele=isNaN(a)?null:a;let n=t.getElementValue(l,"time");r.time=null==n?null:new Date(n),u.push(r)}r.distance=t.calculDistance(u),r.elevation=t.calcElevation(u),r.slopes=t.calculSlope(u,r.distance.cumul),r.points=u,t.routes.push(r)}var o=[].slice.call(this.xmlSource.querySelectorAll("trk"));for(let e in o){let l=o[e],r={};r.name=t.getElementValue(l,"name"),r.cmt=t.getElementValue(l,"cmt"),r.desc=t.getElementValue(l,"desc"),r.src=t.getElementValue(l,"src"),r.number=t.getElementValue(l,"number");let a=t.queryDirectSelector(l,"type");r.type=null!=a?a.innerHTML:null;let n={},i=l.querySelector("link");null!=i&&(n.href=i.getAttribute("href"),n.text=t.getElementValue(i,"text"),n.type=t.getElementValue(i,"type")),r.link=n;let s=[],p=[].slice.call(l.querySelectorAll("trkpt"));for(let e in p){var u=p[e];let l={};l.lat=parseFloat(u.getAttribute("lat")),l.lon=parseFloat(u.getAttribute("lon"));let r=parseFloat(t.getElementValue(u,"ele"));l.ele=isNaN(r)?null:r;let a=t.getElementValue(u,"time");l.time=null==a?null:new Date(a),s.push(l)}r.distance=t.calculDistance(s),r.elevation=t.calcElevation(s),r.slopes=t.calculSlope(s,r.distance.cumul),r.points=s,t.tracks.push(r)}},gpxParser.prototype.getElementValue=function(e,t){let l=e.querySelector(t);return null!=l?null!=l.innerHTML?l.innerHTML:l.childNodes[0].data:l},gpxParser.prototype.queryDirectSelector=function(e,t){let l=e.querySelectorAll(t),r=l[0];if(l.length>1){let l=e.childNodes;for(idx in l)elem=l[idx],elem.tagName===t&&(r=elem)}return r},gpxParser.prototype.calculDistance=function(e){let t={},l=0,r=[];for(var a=0;a<e.length-1;a++)l+=this.calcDistanceBetween(e[a],e[a+1]),r[a]=l;return r[e.length-1]=l,t.total=l,t.cumul=r,t},gpxParser.prototype.calcDistanceBetween=function(e,t){let l={};l.lat=e.lat,l.lon=e.lon;let r={};r.lat=t.lat,r.lon=t.lon;var a=Math.PI/180,n=l.lat*a,i=r.lat*a,s=Math.sin((r.lat-l.lat)*a/2),o=Math.sin((r.lon-l.lon)*a/2),u=s*s+Math.cos(n)*Math.cos(i)*o*o;return 6371e3*(2*Math.atan2(Math.sqrt(u),Math.sqrt(1-u)))},gpxParser.prototype.calcElevation=function(e){for(var t=0,l=0,r={},a=0;a<e.length-1;a++){let r=e[a+1].ele,n=e[a].ele;if(null!==r&&null!==n){let e=parseFloat(r)-parseFloat(n);e<0?l+=e:e>0&&(t+=e)}}for(var n=[],i=0,s=(a=0,e.length);a<s;a++){if(null!==e[a].ele){var o=parseFloat(e[a].ele);n.push(o),i+=o}}return r.max=Math.max.apply(null,n)||null,r.min=Math.min.apply(null,n)||null,r.pos=Math.abs(t)||null,r.neg=Math.abs(l)||null,r.avg=i/n.length||null,r},gpxParser.prototype.calculSlope=function(e,t){let l=[];for(var r=0;r<e.length-1;r++){let a=e[r],n=100*(e[r+1].ele-a.ele)/(t[r+1]-t[r]);l.push(n)}return l},gpxParser.prototype.toGeoJSON=function(){var e={type:"FeatureCollection",features:[],properties:{name:this.metadata.name,desc:this.metadata.desc,time:this.metadata.time,author:this.metadata.author,link:this.metadata.link}};for(idx in this.tracks){let r=this.tracks[idx];var t={type:"Feature",geometry:{type:"LineString",coordinates:[]},properties:{}};for(idx in t.properties.name=r.name,t.properties.cmt=r.cmt,t.properties.desc=r.desc,t.properties.src=r.src,t.properties.number=r.number,t.properties.link=r.link,t.properties.type=r.type,r.points){let e=r.points[idx];(l=[]).push(e.lon),l.push(e.lat),l.push(e.ele),t.geometry.coordinates.push(l)}e.features.push(t)}for(idx in this.routes){let r=this.routes[idx];t={type:"Feature",geometry:{type:"LineString",coordinates:[]},properties:{}};for(idx in t.properties.name=r.name,t.properties.cmt=r.cmt,t.properties.desc=r.desc,t.properties.src=r.src,t.properties.number=r.number,t.properties.link=r.link,t.properties.type=r.type,r.points){let e=r.points[idx];var l;(l=[]).push(e.lon),l.push(e.lat),l.push(e.ele),t.geometry.coordinates.push(l)}e.features.push(t)}for(idx in this.waypoints){let l=this.waypoints[idx];(t={type:"Feature",geometry:{type:"Point",coordinates:[]},properties:{}}).properties.name=l.name,t.properties.sym=l.sym,t.properties.cmt=l.cmt,t.properties.desc=l.desc,t.geometry.coordinates=[l.lon,l.lat,l.ele],e.features.push(t)}return e}, true&&(__webpack_require__(/*! jsdom-global */ "../node_modules/jsdom-global/browser.js")(),module.exports=gpxParser);

/***/ }),

/***/ "../node_modules/jsdom-global/browser.js":
/*!***********************************************!*\
  !*** ../node_modules/jsdom-global/browser.js ***!
  \***********************************************/
/***/ ((module) => {

/*
 * this is what browserify will use if you use browserify on your tests.
 * no need to bootstrap a DOM environment in a browser.
 */

module.exports = function () {
  return noop
}

function noop () { }


/***/ }),

/***/ "./gpxParsing.tsx":
/*!************************!*\
  !*** ./gpxParsing.tsx ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ parseGpxFile)
/* harmony export */ });
/* harmony import */ var gpxparser__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! gpxparser */ "../node_modules/gpxparser/dist/GPXParser.min.js");
/* harmony import */ var gpxparser__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(gpxparser__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _turf_turf__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @turf/turf */ "../node_modules/@turf/turf/dist/es/index.js");
/* harmony import */ var _mapTools__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./mapTools */ "./mapTools.ts");



function smoothPoints(originalPoints, percentileCutoff) {
    // Collect the distance from each point to the next point
    // length = originalPoints.length - 1
    const pairDistances = [];
    for (let i = 0; i < originalPoints.length - 1; i++) {
        pairDistances.push(_turf_turf__WEBPACK_IMPORTED_MODULE_1__.distance((0,_mapTools__WEBPACK_IMPORTED_MODULE_2__.toGeoJson)(originalPoints[i]), (0,_mapTools__WEBPACK_IMPORTED_MODULE_2__.toGeoJson)(originalPoints[i + 1])));
    }
    pairDistances.sort();
    // Compute distance cutoff by multiplying the median distance by the given percentile
    // of course it's not really a "percentile" anymore, but good enough
    const distanceCutoff = percentileCutoff * pairDistances[Math.floor(pairDistances.length / 2)];
    console.log('Distance cutoff is', distanceCutoff, 'km');
    // For smoothness, massage the gpx route by merging points below distance cutoff
    // the assumption here is that points are evenly spaced in time (maybe not always true?)
    const smoothedPoints = [originalPoints[0]];
    let idx = 1;
    while (idx < originalPoints.length - 1) {
        let summedDistance = 0;
        while (summedDistance < distanceCutoff && idx < originalPoints.length - 1) {
            summedDistance += _turf_turf__WEBPACK_IMPORTED_MODULE_1__.distance((0,_mapTools__WEBPACK_IMPORTED_MODULE_2__.toGeoJson)(originalPoints[idx]), (0,_mapTools__WEBPACK_IMPORTED_MODULE_2__.toGeoJson)(originalPoints[idx + 1]));
            idx += 1;
        }
        smoothedPoints.push(originalPoints[idx]);
        idx += 1;
    }
    // We remember to add on the last point
    smoothedPoints.push(originalPoints[originalPoints.length - 1]);
    console.log(`After smoothing: ${originalPoints.length} -> ${smoothedPoints.length}`);
    return smoothedPoints;
}
function parseGpxFile(gpxContents, smoothingFactor = 0.3, joinTracks = false) {
    const gpx = new (gpxparser__WEBPACK_IMPORTED_MODULE_0___default())();
    gpx.parse(gpxContents);
    const originalPoints = joinTracks
        ? gpx.tracks.flatMap((track) => track.points)
        : gpx.tracks[0].points;
    const name = joinTracks
        ? gpx.tracks.map((t) => t.name).join(', ')
        : gpx.tracks[0].name;
    let points = smoothingFactor != null
        ? smoothPoints(originalPoints, smoothingFactor)
        : originalPoints;
    const distance = {
        total: points
            .slice(1)
            .reduce((acc, cur, idx) => acc + _turf_turf__WEBPACK_IMPORTED_MODULE_1__.distance((0,_mapTools__WEBPACK_IMPORTED_MODULE_2__.toGeoJson)(cur), (0,_mapTools__WEBPACK_IMPORTED_MODULE_2__.toGeoJson)(points[idx])), 0),
    };
    return {
        distance,
        points,
        name,
        sizeBytes: gpxContents.length,
    };
}


/***/ }),

/***/ "./mapTools.ts":
/*!*********************!*\
  !*** ./mapTools.ts ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
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
    return [point.lon, point.lat, point.ele];
}
function pointsToGeoJsonFeature(points, label) {
    return {
        type: 'geojson',
        data: {
            type: 'Feature',
            properties: {
                label,
            },
            geometry: {
                type: 'LineString',
                coordinates: points.map(toGeoJson),
            },
        },
    };
}
function geoJsonToPoint(pt) {
    const { coordinates } = pt.geometry;
    return {
        lon: coordinates[0],
        lat: coordinates[1],
        ele: coordinates.length > 2 ? coordinates[2] : 0,
    };
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
        ele: prev.ele + cur.ele / n,
    }), { lat: 0, lon: 0, ele: 0 });
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


/***/ })

}]);
//# sourceMappingURL=gpxParsing_tsx.bundle.js.map