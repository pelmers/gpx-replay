import GpxParser from 'gpxparser';
import * as turf from '@turf/turf';

import { GpxInfo, LatLon } from './types';
import { toGeoJson } from './mapTools';

function smoothPoints(originalPoints: LatLon[], percentileCutoff: number) {
    // Collect the distance from each point to the next point
    // length = originalPoints.length - 1
    const pairDistances = [];
    for (let i = 0; i < originalPoints.length - 1; i++) {
        pairDistances.push(
            turf.distance(
                toGeoJson(originalPoints[i]),
                toGeoJson(originalPoints[i + 1])
            )
        );
    }
    pairDistances.sort();
    // Compute distance cutoff by multiplying the median distance by the given percentile
    // of course it's not really a "percentile" anymore, but good enough
    const distanceCutoff =
        percentileCutoff * pairDistances[Math.floor(pairDistances.length / 2)];
    console.log('Distance cutoff is', distanceCutoff, 'km');

    // For smoothness, massage the gpx route by merging points below distance cutoff
    // the assumption here is that points are evenly spaced in time (maybe not always true?)
    const smoothedPoints = [originalPoints[0]];
    let idx = 1;
    while (idx < originalPoints.length - 1) {
        let segmentStart = originalPoints[idx];
        let summedDistance = 0;
        while (summedDistance < distanceCutoff && idx < originalPoints.length - 1) {
            summedDistance += turf.distance(
                toGeoJson(originalPoints[idx]),
                toGeoJson(originalPoints[idx + 1])
            );
            idx += 1;
        }
        smoothedPoints.push(segmentStart, originalPoints[idx]);
        idx += 1;
    }
    // We remember to add on the last point
    smoothedPoints.push(originalPoints[originalPoints.length - 1]);
    console.log(`After smoothing: ${originalPoints.length} -> ${smoothedPoints.length}`);
    return smoothedPoints;
}

export default function parseGpxFile(
    gpxContents: string,
    smoothingFactor: number = 0.3
): GpxInfo {
    const gpx = new GpxParser();
    gpx.parse(gpxContents);

    const originalPoints = gpx.tracks[0].points;
    // TODO: make this points smoothing an option at import time
    let points =
        smoothingFactor != null
            ? smoothPoints(originalPoints, smoothingFactor)
            : originalPoints;

    const distance = {
        total: points
            .slice(1)
            .reduce(
                (acc, cur, idx) =>
                    acc + turf.distance(toGeoJson(cur), toGeoJson(points[idx])),
                0
            ),
    };
    return {
        distance,
        points,
        name: gpx.tracks[0].name,
        sizeBytes: gpxContents.length,
    };
}
