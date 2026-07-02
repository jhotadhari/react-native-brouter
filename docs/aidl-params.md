# AIDL Parameter Reference

The authoritative mapping between the BRouter AIDL `Bundle` keys and the JS `RouteRequest` fields.

Source of truth: `android/src/main/aidl/btools/routingapp/IBRouterService.aidl` comment block.

## Complete key mapping

| AIDL key | Bundle type | JS field | JS type | Serialization | Default |
|---|---|---|---|---|---|
| `lonlats` | `String` | `waypoints` | `Waypoint[]` | `lng,lat[,name][,d]\|...` | — (required) |
| `lats` | `double[]` | `waypoints` | `Waypoint[]` | Extract `.position[1]` from each | — (required) |
| `lons` | `double[]` | `waypoints` | `Waypoint[]` | Extract `.position[0]` from each | — (required) |
| `straight` | `String` | `waypoints[].direct` | `Waypoint[]` | Comma-separated indices: `idx,...` | — |
| `profile` | `String` | `profile` | `string` | Strip `.brf` extension | — |
| `remoteProfile` | `String` | `remoteProfile` | `string` | Direct pass-through | — |
| `v` | `String` | `vehicle` | `VehicleMode` | Direct: `motorcar\|bicycle\|foot` | — |
| `fast` | `int` | `fast` | `boolean` | `true→1`, `false` omitted | — |
| `trackFormat` | `String` | `format` | `TrackFormat` | Direct: `gpx\|kml\|json` | `gpx` |
| `alternativeidx` | `int` | `alternativeIndex` | `0\|1\|2\|3` | Direct | `0` |
| `exportWaypoints` | `int` | `exportWaypoints` | `boolean` | `true→1` | omitted |
| `turnInstructionFormat` | `String` | `turnInstructionFormat` | `TurnInstructionFormat` | Direct: `osmand\|locus` | — |
| `timode` | `int` | `turnInstructionMode` | `TurnInstructionMode` | Enum→int: `none=0`, `auto-choose=1`, `locus=2`, `osmand=3`, `comment=4`, `gpsies=5`, `orux=6`, `locus-old=7` | `0` |
| `heading` | `double` | `heading` | `number` | Direct (degrees) | — |
| `direction` | `double` | `direction` | `number` | Direct (degrees) | — |
| `engineMode` | `int` | `elevation` | `boolean` | `true→2` | `0` |
| `maxRunningTime` | `String` | `maxRunningTime` | `number` | `String.valueOf(seconds)` | `"60"` |
| `pathToFileResult` | `String` | `pathToFileResult` | `string` | Direct | — |
| `acceptCompressedResult` | `boolean` | `acceptCompressedResult` | `boolean` | Direct | — |
| `extraParams` | `Bundle` | `extraParams` | `Record<string,string>` | Each entry: String→putString, Number→putDouble, Boolean→putBoolean | — |
| `nogos` | `String` | `nogos` | `NogoArea[]` | `lng,lat,radius[,weight]\|...` | — |
| `nogoLats` | `double[]` | `nogos` | `NogoArea[]` | Extract `.position[1]` from each | — |
| `nogoLons` | `double[]` | `nogos` | `NogoArea[]` | Extract `.position[0]` from each | — |
| `nogoRadi` | `double[]` | `nogos` | `NogoArea[]` | Extract `.radiusMeters` from each | — |
| `polylines` | `String` | `polylines` | `Polyline[]` | `lng,lat,...,weight\|...` | — |
| `polygons` | `String` | `polygons` | `Polygon[]` | `lng,lat,...,weight\|...` | — |
| `pois` | `String` | `pois` | `Poi[]` | `lng,lat,name\|...` | — |

## Not AIDL keys (consumed by the library)

| Key | Type | JS field | Used by | Description |
|---|---|---|---|---|
| `connectTimeout` | `int` | `connectTimeout` | `BRouterClient` constructor | Connection timeout in ms; not passed to BRouter |

## Wire format details

### `lonlats`

Pipe-delimited waypoint string. Each segment: `lng,lat[,name][,d]`.

```
"10.0,20.0,Start|30.0,40.0,d|50.0,60.0"
```
- Waypoint 1: `(10.0, 20.0)` named "Start"
- Waypoint 2: `(30.0, 40.0)` direct route from WP1
- Waypoint 3: `(50.0, 60.0)` normal routing from WP2

### `nogos`

Pipe-delimited nogo string. Each segment: `lng,lat,radius[,weight]`.

```
"15.0,25.0,500|35.0,45.0,1000,2"
```
- Zone 1: center `(15.0, 25.0)`, 500m radius
- Zone 2: center `(35.0, 45.0)`, 1000m radius, weight 2

### `polylines` / `polygons`

Pipe-delimited coordinate strings. Each segment: `lng,lat,...[,weight]`.

```
"15.0,25.0,16.0,26.0|35.0,45.0,36.0,46.0,3"
```
- Polyline 1: two points `(15,25)→(16,26)`
- Polyline 2: two points `(35,45)→(36,46)` with weight 3

### `pois`

Pipe-delimited POI string. Each segment: `lng,lat,name`.

```
"15.0,25.0,Cafe|35.0,45.0,Viewpoint"
```

### `straight`

Comma-separated 0-based indices into the waypoint list.

```
"1,3"
```
Waypoints at index 1 and 3 are direct-routing points.

## Adding a new AIDL parameter

1. Verify the key is documented in `IBRouterService.aidl`
2. Add the field to `RouteRequest` in `src/types.ts`
3. Add serialization in `src/index.tsx` `serializeParams()`
4. Add the mapping in `ParamMapper.java` `toBundle()`
5. Add a test in both `index.test.tsx` and `ParamMapperTest.java`
6. Update this document
