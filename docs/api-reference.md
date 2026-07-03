# API Reference

Complete reference for the Core API (`react-native-brouter`) and GeoJSON API (`react-native-brouter/geojson`).

## Core API

### `getRoute(request: RouteRequest): Promise<RouteResult>`

Request a route from the BRouter Android app. Throws `BRouterError` on failure.

```ts
import { getRoute } from 'react-native-brouter';
```

### `RouteRequest`

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `waypoints` | `Waypoint[]` | **yes** | — | At least 2 waypoints required |
| `profile` | `string` | no | — | BRouter profile file name without `.brf` extension |
| `remoteProfile` | `string` | no | — | Raw profile content; overrides `profile` + `vehicle` + `fast` |
| `vehicle` | `VehicleMode` | no | — | `'motorcar'` \| `'bicycle'` \| `'foot'` |
| `fast` | `boolean` | no | — | Fast mode; ignored if `remoteProfile` is set |
| `format` | `TrackFormat` | no | `'gpx'` | `'gpx'` \| `'kml'` \| `'json'` |
| `alternativeIndex` | `0 \| 1 \| 2 \| 3` | no | `0` | Which alternative route to return |
| `nogos` | `NogoArea[]` | no | — | Exclusion zones as point+radius circles |
| `polylines` | `Polyline[]` | no | — | Waypoint corridor constraints |
| `polygons` | `Polygon[]` | no | — | Area constraints |
| `pois` | `Poi[]` | no | — | Points of interest to include in output |
| `exportWaypoints` | `boolean` | no | — | Include waypoint markers in output |
| `turnInstructionFormat` | `TurnInstructionFormat` | no | — | `'osmand'` \| `'locus'` |
| `turnInstructionMode` | `TurnInstructionMode` | no | — | `'none'` \| `'auto-choose'` \| `'locus'` \| `'osmand'` \| `'comment'` \| `'gpsies'` \| `'orux'` \| `'locus-old'` |
| `heading` | `number` | no | — | Start direction in degrees |
| `direction` | `number` | no | — | Recalculation start direction in degrees |
| `elevation` | `boolean` | no | — | Request elevation data (`engineMode=2`) |
| `maxRunningTime` | `number` | no | `60` | Routing timeout in seconds |
| `connectTimeout` | `number` | no | `1000` | Connection timeout in milliseconds |
| `pathToFileResult` | `string` | no | — | Save result to file instead of returning via promise |
| `acceptCompressedResult` | `boolean` | no | — | Request compressed output (gpx format only) |
| `extraParams` | `Record<string, string>` | no | — | Arbitrary key=value pairs passed to BRouter profile |

### `Waypoint`

```ts
interface Waypoint {
  position: Position;           // [lng, lat, alt?]
  name?: string;                // preserved in output, not optimized away
  direct?: boolean;             // straight-line segment from previous waypoint
}
```

### `NogoArea`

```ts
interface NogoArea {
  position: Position;           // [lng, lat] center
  radiusMeters: number;         // exclusion radius
  weight?: number;              // penalty weight
}
```

### `Polyline` / `Polygon`

```ts
interface Polyline {
  positions: Position[];        // [lng, lat]* sequence
  weight?: number;              // penalty weight
}

interface Polygon {
  positions: Position[];        // closed ring [lng, lat]*
  weight?: number;
}
```

### `Poi`

```ts
interface Poi {
  position: Position;           // [lng, lat]
  name: string;
}
```

### `RouteResult`

```ts
interface RouteResult {
  raw: string;                  // GPX, KML, or JSON track
  format: TrackFormat;          // the format of the returned track
}
```

### `BRouterError`

```ts
interface BRouterError {
  code: string;                 // e.g. 'SERVICE_UNAVAILABLE', 'INVALID_PARAMS'
  message: string;              // human-readable description
}
```

---

## GeoJSON API

```ts
import { getRoute, polygonToNogoAreas } from 'react-native-brouter/geojson';
import type { Position } from 'react-native-brouter/geojson';
```

### `getRoute(request: GeoJSONRouteRequest): Promise<GeoJSONRouteResult>`

Same as the core API but accepts GeoJSON `Position[]` for waypoints. Parses JSON results into typed `FeatureCollection` objects.

### `GeoJSONRouteRequest`

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `waypoints` | `Position[]` | **yes** | — | GeoJSON positions: `[[lng, lat], ...]` |
| `profile` | `string` | no | — | Same as core |
| `remoteProfile` | `string` | no | — | Same as core |
| `vehicle` | `VehicleMode` | no | — | Same as core |
| `fast` | `boolean` | no | — | Same as core |
| `format` | `TrackFormat` | no | `'gpx'` | Same as core |
| `alternativeIndex` | `0 \| 1 \| 2 \| 3` | no | `0` | Same as core |
| `nogos` | `NogoArea[]` | no | — | Same as core (point+radius circles) |
| `exportWaypoints` | `boolean` | no | — | Same as core |
| `heading` | `number` | no | — | Same as core |
| `direction` | `number` | no | — | Same as core |
| `elevation` | `boolean` | no | — | Same as core |
| `maxRunningTime` | `number` | no | `60` | Same as core |
| `connectTimeout` | `number` | no | `1000` | Same as core |
| `pathToFileResult` | `string` | no | — | Same as core |
| `acceptCompressedResult` | `boolean` | no | — | Same as core |
| `extraParams` | `Record<string, string>` | no | — | Same as core |

> **Note:** `polylines`, `polygons`, `pois`, `turnInstructionFormat`, and `turnInstructionMode` are not currently exposed in the GeoJSON API. Use the core API for these. For polygon-based nogo areas, use `polygonToNogoAreas()` to convert GeoJSON geometries to circular `NogoArea[]` approximations.

### `GeoJSONRouteResult`

```ts
interface GeoJSONRouteResult {
  raw: string;                  // raw track string
  format: TrackFormat;          // format of returned track
  parsed?: {                     // only when format === 'json'
    track: FeatureCollection<LineString>;   // route geometry
    waypoints: FeatureCollection<Point>;    // input waypoints as points
    summary: RouteSummary;                  // extracted statistics
  };
}
```

### `RouteSummary`

```ts
interface RouteSummary {
  totalDistanceMeters?: number;   // from BRouter's 'track-length'
  totalDurationSeconds?: number;  // from BRouter's 'total-time'
  ascentMeters?: number;          // from BRouter's 'filtered ascend'
  descentMeters?: number;         // from BRouter's 'plain-descent'
  trackPointCount?: number;       // count of coordinates in track
}
```

### `polygonToNogoAreas(geometry, weight?): NogoArea[]`

Convert a GeoJSON `Polygon` or `MultiPolygon` to an array of `NogoArea` entries. Uses a centroid + bounding-circle approximation.

```ts
import { polygonToNogoAreas } from 'react-native-brouter/geojson';

const poly: Polygon = { type: 'Polygon', coordinates: [[[10,20],[10.1,20],[10.1,20.1],[10,20.1],[10,20]]] };
const nogos = polygonToNogoAreas(poly, 5); // weight = 5
// → [{ position: [~10.05, ~20.05], radiusMeters: ~7860, weight: 5 }]
```

> **Limitation:** This is a bounding-circle approximation. For precise polygon-based routing constraints, use the core API's `polygons` field directly.

### Re-exported types

The GeoJSON entry point re-exports `Position` from `@types/geojson` so consumers don't need their own dependency:

```ts
import type { Position, BRouterError, RouteResult, TrackFormat, VehicleMode } from 'react-native-brouter/geojson';
```

## Position type

`Position = ReadonlyArray<number>` — `[lng, lat, alt?]`. This is the same convention used by:
- `@types/geojson` (`geojson.Position`)
- `react-native-mapsforge-vtm` (mapsforge VTM native views)
- `@turf/turf` (Turf.js geometry helpers)

## Type exports

All types are exported and available to consumers:

```ts
// From 'react-native-brouter':
import type {
  Position, Waypoint, NogoArea, Polyline, Polygon, Poi,
  VehicleMode, TrackFormat, TurnInstructionFormat, TurnInstructionMode,
  RouteRequest, RouteResult, BRouterError,
} from 'react-native-brouter';

// From 'react-native-brouter/geojson':
import type {
  Position, BRouterError, RouteResult, TrackFormat, VehicleMode,
  GeoJSONRouteRequest, GeoJSONRouteResult, RouteSummary,
} from 'react-native-brouter/geojson';
```
