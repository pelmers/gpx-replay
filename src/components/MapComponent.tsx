import React from 'react';
import { GpxInfo, LatLon } from '../types';

import { MAPBOX_API_KEY } from '../mapboxApiKey';
import { toGeoJson } from '../map';
import mapboxgl from 'mapbox-gl';

type Props = {
    gpxInfo: GpxInfo;
};

export default class MapComponent extends React.Component<Props, {}> {
    mapDivRef = React.createRef<HTMLDivElement>();
    async componentDidMount() {
        const gpsPoints = this.props.gpxInfo.points;
        const map = new mapboxgl.Map({
            container: this.mapDivRef.current!,
            zoom: 16,
            pitch: 60,
            center: toGeoJson(gpsPoints[0]),
            // TODO: let user pick the style
            style: ' mapbox://styles/mapbox/outdoors-v11',
            accessToken: MAPBOX_API_KEY,
        });
        const addSource = (
            id: string,
            points: LatLon[],
            params: mapboxgl.LinePaint
        ) => {
            map.addSource(id, {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: points.map(toGeoJson),
                    },
                },
            }).addLayer({
                id,
                type: 'line',
                source: id,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round',
                },
                paint: params,
            });
        };
        await new Promise((resolve) => {
            map.once('styledata', () => {
                addSource('gpxTrack', gpsPoints, {
                    // TODO: let user pick color/width?
                    'line-color': '#888',
                    'line-width': 2,
                });
                resolve(map);
            });
        });
    }

    render() {
        // TODO outline:
        // 1. map itself
        // 2. scrubbable progress bar, and playback rate (also slider?)
        // 3. followcam toggle
        // 4. inputs for the different options:
        //  - constant speed or given speed
        //  - map style
        //  - icon type, icon size
        //  - line color, line thickness
        // bonus:
        // - elevation profile?
        // TODO: show gpx info and map component
        // TODO: also options for various things
        return (
            <>
                <div id="map-container" ref={this.mapDivRef} />
            </>
        );
    }
}
