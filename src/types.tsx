export type GpxInfo = {
    name: string;
    distance: {
        total: number;
    };
    points: LatLon[];
    sizeBytes: number;
};

type LatLonBase = {
    lat: number;
    lon: number;
};

// Matches any type that has LatLonBase as a subset
export interface LatLon extends Required<LatLonBase> {}
