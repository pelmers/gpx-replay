export declare type GpxInfo = {
    name: string;
    distance: {
        total: number;
    };
    points: LatLonEle[];
    sizeBytes: number;
};
declare type LatLonBase = {
    lat: number;
    lon: number;
};
export interface LatLonEle extends Required<LatLonBase> {
    ele: number;
}
export declare type GeoJsonPoint = [number, number, number];
export {};
