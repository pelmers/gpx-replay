import React from 'react';
import { GpxInfo, LatLonEle } from '../types';
import { toGeoJson, toGeoJsonFeature } from '../mapTools';
import * as turf from '@turf/turf';

// @ts-ignore no types for heightgraph :(
import { HeightGraph } from 'map.heightgraph/src/heightgraph';

import 'map.heightgraph/src/heightgraph.css';

export type HeightGraphComponentProps = {
    gpxInfo: GpxInfo;
    applyPositionUpdate: (sendUpdateToMe: (position: number) => void) => void;
};

export class HeightGraphComponent extends React.Component<HeightGraphComponentProps> {
    heightGraphDivRef = React.createRef<HTMLDivElement>();
    heightGraph: any;
    cumulativeDistanceList: number[] = [0];

    constructor(props: HeightGraphComponentProps) {
        super(props);
        // Initialize cumulative distance list
        let cumulativeDistance = 0;
        const {points} = this.props.gpxInfo;
        for (let pointIndex = 0; pointIndex < points.length - 1; pointIndex++) {
            const currentFrameFeature = toGeoJsonFeature(points[pointIndex]);
            const nextFrameFeature = toGeoJsonFeature(points[pointIndex + 1]);
            const distance = turf.distance(currentFrameFeature, nextFrameFeature);
            cumulativeDistance += distance;
            this.cumulativeDistanceList.push(cumulativeDistance);
        }
    }

    render() {
        return (
            <div className="heightgraph-container-container">
                <div id="heightgraph-container" ref={this.heightGraphDivRef} />
            </div>
        );
    }

    componentDidMount() {
        const containerHeight = this.heightGraphDivRef.current!.clientHeight;
        const containerWidth = this.heightGraphDivRef.current!.clientWidth;
        const marginLeft = 60;
        const marginRight = 10;
        this.heightGraph = new HeightGraph(
            this.heightGraphDivRef.current,
            {
                width: containerWidth,
                height: containerHeight,
                margins: {
                    top: 3,
                    bottom: 20,
                    left: marginLeft,
                    right: marginRight,
                },
                expandControls: false,
            },
            {
                pointSelectedCallback: () => {
                    // Note: this slightly misleading function is actually called on mouse over any point on the graph,
                    // not on click
                },
                // placeholders, see example at https://github.com/boldtrn/Leaflet.Heightgraph/blob/no_leaflet/example/MaplibreHeightGraph.js
                areaSelectedCallback: () => {},
                routeSegmentsSelectedCallback: () => {},
            }
        );
        // Turn off the drag handler because I am cheating by using the drag selection to show the current position
        this.heightGraph._dragStartHandler = () => {};
        this.heightGraph._dragHandler = () => {};
        this.heightGraph._mouseUpHandler = () => {};
        this.heightGraph.setData([
            {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        geometry: {
                            type: 'LineString',
                            coordinates: this.props.gpxInfo.points.map(toGeoJson),
                        },
                        properties: {
                            attributeType: this.props.gpxInfo.name,
                            summary: 'Elevation',
                        },
                    },
                ],
                properties: {
                    label: this.props.gpxInfo.name,
                },
            },
        ]);
        this.props.applyPositionUpdate((position) => {
            // Convert the position to a distance by looking up in cumdist list
            const distance = this.cumulativeDistanceList[Math.floor(position)];
            this.heightGraph._drawDragRectangle(0, this.heightGraph._x(distance));
        });
    }
}
