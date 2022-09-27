/// <reference types="mapbox-gl" />
import { Feature, Point } from '@turf/turf';
import { LatLon } from './types';
export declare function toGeoJson(point: LatLon): [number, number];
export declare function pointsToGeoJsonFeature(points: LatLon[]): {
    type: "geojson";
    data: {
        type: "Feature";
        properties: {};
        geometry: {
            type: "LineString";
            coordinates: [number, number][];
        };
    };
};
export declare function geoJsonToPoint(pt: Feature<Point>): LatLon;
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
