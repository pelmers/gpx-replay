export declare type GpxInfo = {
    name: string;
    distance: {
        total: number;
    };
    points: LatLon[];
    sizeBytes: number;
};
declare type LatLonBase = {
    lat: number;
    lon: number;
};
export interface LatLon extends Required<LatLonBase> {
}
export {};
