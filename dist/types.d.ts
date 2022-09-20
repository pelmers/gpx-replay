export declare type GpxInfo = {
    name: string;
    distance: {
        total: number;
    };
    points: LatLon[];
};
declare type LatLonBase = {
    lat: number;
    lon: number;
};
export interface LatLon extends Required<LatLonBase> {
}
export {};
