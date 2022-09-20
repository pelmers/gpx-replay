import { MAPBOX_API_KEY } from './mapboxApiKey';
import { LatLon } from './types';

export function toGeoJson(point: LatLon): [number, number] {
    return [point.lon, point.lat];
}

export function toGeoJsonFeature(point: LatLon) {
    return {
        type: 'Feature' as const,
        geometry: {
            type: 'Point' as const,
            coordinates: toGeoJson(point),
        },
        properties: {},
    };
}

export function toGeoJsonLineString(from: LatLon, to: LatLon) {
    return {
        type: 'Feature' as const,
        geometry: {
            type: 'LineString' as const,
            coordinates: [toGeoJson(from), toGeoJson(to)],
        },
        properties: {},
    };
}

export function findCenter(gpsPoints: LatLon[]): [number, number] {
    const n = gpsPoints.length;
    const avg = gpsPoints.reduce(
        (prev, cur) => ({
            lat: prev.lat + cur.lat / n,
            lon: prev.lon + cur.lon / n,
        }),
        { lat: 0, lon: 0 }
    );
    return toGeoJson(avg);
}

export function findBounds(gpsPoints: LatLon[]): mapboxgl.LngLatBoundsLike {
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
