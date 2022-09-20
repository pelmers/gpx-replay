[![Logo](static/logo.png)](https://gpx.pelmers.com/)

## Website: [gpx.pelmers.com](https://gpx.pelmers.com)

### Description

GPX Replay takes your GPX file and replays it on a map. The tool runs entirely on the client browser.
Essentially it's a subset of [streetwarp-web](https://github.com/pelmers/streetwarp-web) that skips the video generation.
The map uses the [mapbox](https://www.mapbox.com) API.
I made this tool to add map animations to my [Eurovelo 6 video guide](https://www.youtube.com/watch?v=g8bpJm3dWoo).

### Features

-   Upload GPX file (track or route) and see it on a map
-   Customize replay speed
-   Replay either at recorded speed or constant speed
-   Customize replay symbol

### Usage

```
yarn
yarn build
```

You should create a file `src/mapboxApiKey.ts` with the following contents:

```ts
export const MAPBOX_API_KEY = 'YOUR KEY HERE';
```

### Future Plans

-   None at the moment, feel free to open issues for feature requests
