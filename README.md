[![Logo](static/logo.png)](https://gpx.pelmers.com/)

## Website: [gpx.pelmers.com](https://gpx.pelmers.com)

![](res/10s_demo.gif)

### Description

GPX Replay takes your GPX file and replays it on a map. The tool runs entirely
on the client browser.

Repeat: **no data is sent to a server**. The GPX file is loaded into the
browser and processed on your computer.

Essentially it began as a subset of
[streetwarp-web](https://github.com/pelmers/streetwarp-web) that skipped the
video generation, then I added a bunch of things to it. The map uses the
[mapbox](https://www.mapbox.com) API. I made this tool to add map animations
to my [Eurovelo 6 video guide](https://www.youtube.com/watch?v=g8bpJm3dWoo).

### Features

-   Upload GPX file (track or route) and see it on a map
-   Replay the GPX file, allowing many custom settings

![Map Examples](res/gpx_examples.jpg)

### Usage

```
yarn
yarn build
```

You should create a file `src/mapboxApiKey.ts` with the following contents:

```ts
export const MAPBOX_API_KEY = 'YOUR KEY HERE';
```

### New Features

-   Added elevation profile (via [boldtrn/Leaflet.Heightgraph](https://github.com/boldtrn/Leaflet.Heightgraph))
