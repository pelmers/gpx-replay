import { Feature, Point } from '@turf/turf';
import { GeoJsonPoint, LatLonEle } from './types';

export function toGeoJson(point: LatLonEle): GeoJsonPoint {
    return [point.lon, point.lat, point.ele];
}

export function pointsToGeoJsonFeature(points: LatLonEle[], label?: string) {
    return {
        type: 'geojson' as const,
        data: {
            type: 'Feature' as const,
            properties: {
                label,
            },
            geometry: {
                type: 'LineString' as const,
                coordinates: points.map(toGeoJson),
            },
        },
    };
}

export function geoJsonToPoint(pt: Feature<Point>): LatLonEle {
    const { coordinates } = pt.geometry;
    return {
        lon: coordinates[0],
        lat: coordinates[1],
        ele: coordinates.length > 2 ? coordinates[2] : 0,
    };
}

export function toGeoJsonFeature(point: LatLonEle) {
    return {
        type: 'Feature' as const,
        geometry: {
            type: 'Point' as const,
            coordinates: toGeoJson(point),
        },
        properties: {},
    };
}

export function toGeoJsonLineString(from: LatLonEle, to: LatLonEle) {
    return {
        type: 'Feature' as const,
        geometry: {
            type: 'LineString' as const,
            coordinates: [toGeoJson(from), toGeoJson(to)],
        },
        properties: {},
    };
}

export function findCenter(gpsPoints: LatLonEle[]): GeoJsonPoint {
    const n = gpsPoints.length;
    const avg = gpsPoints.reduce(
        (prev, cur) => ({
            lat: prev.lat + cur.lat / n,
            lon: prev.lon + cur.lon / n,
            ele: prev.ele + cur.ele / n,
        }),
        { lat: 0, lon: 0, ele: 0 }
    );
    return toGeoJson(avg);
}

export function findBounds(gpsPoints: LatLonEle[]): mapboxgl.LngLatBoundsLike {
    const [sw, ne] = gpsPoints.reduce(
        ([sw, ne], cur) => [
            {
                lat: Math.min(cur.lat, sw.lat),
                lng: Math.min(cur.lon, sw.lng),
            },
            { lat: Math.max(cur.lat, ne.lat), lng: Math.max(cur.lon, ne.lng) },
        ],
        [
            { lat: Number.MAX_SAFE_INTEGER, lng: Number.MAX_SAFE_INTEGER },
            { lat: Number.MIN_SAFE_INTEGER, lng: Number.MIN_SAFE_INTEGER },
        ]
    );
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

export const clamp = (num: number, lo: number, hi: number) =>
    num < lo ? lo : num > hi ? hi : num;

// Given bearings a and b in the range [-180, 180], return the short angle that moves a to b.
// examples:
// if a is 10 and b is -10, then the answer is -20.
// if a is -10 and b is 10, then the answer is 20.
// if a is -170 and b is 170, then the answer is -20.
// if a is 170 and b is -170, then the answer is 20.
export const bearingDiff = (a: number, b: number) => {
    // diff will be in the range [0, 360]
    const diff = Math.abs(b - a);
    const sign = b > a ? 1 : -1;
    return sign * (diff > 180 ? -(360 - diff) : diff);
};

// Fix a bearing between [-360, 360] to [-180, 180]
export const fixBearingDomain = (b: number) => {
    if (b < -180) {
        return 360 + b;
    } else if (b > 180) {
        return -360 + b;
    }
    return b;
};
