export type GpxInfo = {
    name: string;
    distance: {
        total: number;
    };
    points: LatLon[];
};

type LatLonBase = {
    lat: number;
    lon: number;
};

export interface LatLon extends Required<LatLonBase> {}
