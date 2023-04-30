/// <reference types="mapbox-gl" />
import { Feature, Point } from '@turf/turf';
import { GeoJsonPoint, LatLonEle } from './types';
export declare function toGeoJson(point: LatLonEle): GeoJsonPoint;
export declare function pointsToGeoJsonFeature(points: LatLonEle[], label?: string): {
    type: "geojson";
    data: {
        type: "Feature";
        properties: {
            label: string | undefined;
        };
        geometry: {
            type: "LineString";
            coordinates: GeoJsonPoint[];
        };
    };
};
export declare function geoJsonToPoint(pt: Feature<Point>): LatLonEle;
export declare function toGeoJsonFeature(point: LatLonEle): {
    type: "Feature";
    geometry: {
        type: "Point";
        coordinates: GeoJsonPoint;
    };
    properties: {};
};
export declare function toGeoJsonLineString(from: LatLonEle, to: LatLonEle): {
    type: "Feature";
    geometry: {
        type: "LineString";
        coordinates: GeoJsonPoint[];
    };
    properties: {};
};
export declare function findCenter(gpsPoints: LatLonEle[]): GeoJsonPoint;
export declare function findBounds(gpsPoints: LatLonEle[]): mapboxgl.LngLatBoundsLike;
export declare const clamp: (num: number, lo: number, hi: number) => number;
export declare const bearingDiff: (a: number, b: number) => number;
export declare const fixBearingDomain: (b: number) => number;
