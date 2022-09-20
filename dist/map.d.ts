/// <reference types="mapbox-gl" />
import { LatLon } from './types';
export declare function toGeoJson(point: LatLon): [number, number];
export declare function toGeoJsonFeature(point: LatLon): {
    type: "Feature";
    geometry: {
        type: "Point";
        coordinates: [number, number];
    };
    properties: {};
};
export declare function toGeoJsonLineString(from: LatLon, to: LatLon): {
    type: "Feature";
    geometry: {
        type: "LineString";
        coordinates: [number, number][];
    };
    properties: {};
};
export declare function findCenter(gpsPoints: LatLon[]): [number, number];
export declare function findBounds(gpsPoints: LatLon[]): mapboxgl.LngLatBoundsLike;
