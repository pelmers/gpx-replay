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

// Matches any type that has LatLonBase as a subset, plus elevation
export interface LatLonEle extends Required<LatLonBase> {
    ele: number;
}

export type GeoJsonPoint = [number, number, number];
