# react-native-brouter

React Native Turbo Module for Android to communicate with the [BRouter](https://github.com/abrensch/brouter) Android app service for offline routing/navigation based on OpenStreetMap data.

## Installation

```sh
npm install react-native-brouter
```

Add this to your app's `AndroidManifest.xml`:
```xml
<queries>
    <package android:name="btools.routingapp" />
</queries>
```

Install the [BRouter Android app](https://github.com/abrensch/brouter) on the device.

## Usage

### Core API

```ts
import { getRoute, type Waypoint } from 'react-native-brouter';

const waypoints: Waypoint[] = [
  { position: [-71.047736, -13.950089] },
  { position: [-70.902377, -13.791436] },
  { position: [-70.97545, -13.591525] },
];

try {
  const result = await getRoute({
    waypoints,
    vehicle: 'bicycle',
    format: 'json',
  });
  console.log(result.raw); // JSON track string
} catch (e) {
  console.log(e.code);     // 'SERVICE_UNAVAILABLE' | 'INVALID_PARAMS' | ...
  console.log(e.message);  // human-readable description
}
```

### GeoJSON API (works with `@turf/turf`)

```ts
import { getRoute } from 'react-native-brouter/geojson';
import turfAlong from '@turf/along';
import { lineString, point } from '@turf/helpers';

const result = await getRoute({
  waypoints: [
    [-71.047736, -13.950089],
    [-70.902377, -13.791436],
    [-70.97545, -13.591525],
  ],
  vehicle: 'bicycle',
  format: 'json',
});

// result.parsed.track → GeoJSON FeatureCollection<LineString>
// result.parsed.waypoints → GeoJSON FeatureCollection<Point>
// result.parsed.summary → { totalDistanceMeters, totalDurationSeconds, ascentMeters, ... }

// Use with turf:
const line = lineString(result.parsed.track.features[0].geometry.coordinates);
const midpoint = turfAlong(line, result.parsed.summary.totalDistanceMeters / 2);
console.log(midpoint.geometry.coordinates); // [lng, lat] of route midpoint
```

### Nogo Areas

```ts
import { getRoute } from 'react-native-brouter';

const result = await getRoute({
  waypoints: [
    { position: [10, 20] },
    { position: [30, 40] },
  ],
  vehicle: 'foot',
  nogos: [
    { position: [15, 25], radiusMeters: 500 },           // simple circle
    { position: [35, 45], radiusMeters: 1000, weight: 2 }, // weighted
  ],
});
```

### All Supported Options

| Option | Type | Description |
|---|---|---|
| `waypoints` | `Waypoint[]` (≥2) | Route waypoints with position, optional name, optional direct flag |
| `profile` | `string` | BRouter profile file name (without `.brf`) |
| `remoteProfile` | `string` | Raw profile content (overrides `profile` + `vehicle` + `fast`) |
| `vehicle` | `'motorcar' \| 'bicycle' \| 'foot'` | Travel mode |
| `fast` | `boolean` | Fast mode (ignored if `remoteProfile` is set) |
| `format` | `'gpx' \| 'kml' \| 'json'` | Output format (default `'gpx'`) |
| `alternativeIndex` | `0 \| 1 \| 2 \| 3` | Alternative route index (default 0) |
| `nogos` | `NogoArea[]` | Exclusion zones (position + radiusMeters + optional weight) |
| `polylines` | `Polyline[]` | Waypoint corridors |
| `polygons` | `Polygon[]` | Area constraints |
| `pois` | `Poi[]` | Points of interest in output |
| `exportWaypoints` | `boolean` | Include waypoints in output |
| `turnInstructionFormat` | `'osmand' \| 'locus'` | Turn instruction format |
| `turnInstructionMode` | `'none' \| 'auto-choose' \| 'locus' \| 'osmand' \| 'comment' \| 'gpsies' \| 'orux' \| 'locus-old'` | Turn instruction detail level |
| `heading` | `number` | Start direction in degrees |
| `direction` | `number` | Recalculation start direction in degrees |
| `elevation` | `boolean` | Request elevation data (`engineMode=2`) |
| `maxRunningTime` | `number` | Routing timeout in seconds (default 60) |
| `connectTimeout` | `number` | Connection timeout in ms (default 1000) |
| `pathToFileResult` | `string` | Save result to file path instead of returning |
| `acceptCompressedResult` | `boolean` | Compress gpx output |
| `extraParams` | `Record<string, string>` | Profile setup key=value pairs |

## License

MIT

---

- Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
- The Java code to connect to the BRouter service is copied from [OsmAnd](https://github.com/osmandapp/OsmAnd)
