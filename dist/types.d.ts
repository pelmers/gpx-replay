export type GpxInfo = {
    name: string;
    distance: {
        total: number;
    };
    points: LatLonEle[];
    sizeBytes: number;
};
type LatLonBase = {
    lat: number;
    lon: number;
};
export interface LatLonEle extends Required<LatLonBase> {
    ele: number;
}
export type GeoJsonPoint = [number, number, number];
export {};
