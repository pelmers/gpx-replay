import GpxParser from 'gpxparser';
import * as turf from '@turf/turf';

import { GpxInfo, LatLon } from './types';
import { toGeoJson } from './map';


function smoothPoints(originalPoints: LatLon[], percentileCutoff: number) {
    // Collect the distance from each point to the next point
    // length = originalPoints.length - 1
    const pairDistances = [];
    for (let i = 0; i < originalPoints.length - 1; i++) {
        pairDistances.push(turf.distance(toGeoJson(originalPoints[i]), toGeoJson(originalPoints[i+1])))
    }
    pairDistances.sort();
    const distanceCutoff = pairDistances[Math.floor(percentileCutoff * pairDistances.length)];
    console.log('removing points of dist < ', distanceCutoff);

    // For smoothness, massage the gpx route by merging points in the bottom 20% of speed
    // the assumption here is that points are evenly spaced in time (maybe not always true?)
    const smoothedPoints = [];
    let idx = 0;
    while (idx < originalPoints.length - 1) {
        let segmentStart = originalPoints[idx];
        let summedDistance = 0;
        while (summedDistance < distanceCutoff && idx < originalPoints.length - 1) {
            summedDistance += turf.distance(toGeoJson(originalPoints[idx]), toGeoJson(originalPoints[idx + 1]))
            idx += 1;
        }
        smoothedPoints.push(segmentStart, originalPoints[idx]);
        idx += 1;
    }
    // We remember to add on the last point
    smoothedPoints.push(originalPoints[originalPoints.length - 1]);
    return smoothedPoints;


}

export default function parseGpxFile(gpxContents: string, applySmoothing: boolean = true): GpxInfo {
    const gpx = new GpxParser();
    gpx.parse(gpxContents);

    const originalPoints = gpx.tracks[0].points;
    return {
        distance: gpx.tracks[0].distance,
        // TODO: make this points smoothing an option at import time
        points: (applySmoothing) ? smoothPoints(originalPoints, 0.2): originalPoints,
        name: gpx.tracks[0].name,
        sizeBytes: gpxContents.length,
    };
}