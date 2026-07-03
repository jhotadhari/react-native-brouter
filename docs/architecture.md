# Architecture

End-to-end data flow from a JS `getRoute()` call to the BRouter Android app and back.

## Layers

```
┌─ JS consumer ────────────────────────────────────────────┐
│  await getRoute({ waypoints: [...], vehicle: 'bicycle' }) │
│  → RouteResult { raw: '<gpx>...</gpx>', format: 'gpx' }  │
├─ Core API (src/index.tsx) ───────────────────────────────┤
│  • Validates ≥2 waypoints                                │
│  • Applies defaults (format='gpx')                       │
│  • serializeParams() converts RouteRequest → flat map    │
│  • Calls NativeBRouter.getRoute(params)                  │
│  • normalizeError() maps native rejection → BRouterError │
├─ GeoJSON API (src/geojson/index.ts) ─────────────────────┤
│  • Accepts Position[] waypoints                          │
│  • Converts to core RouteRequest internally              │
│  • parseJsonTrack() normalizes BRouter JSON → FeatureColl │
│  • polygonToNogoAreas() helper for GeoJSON polygons      │
├─ Codegen spec (src/NativeBRouter.ts) ────────────────────┤
│  • TurboModule interface: getRoute(params): Promise<string>│
│  • RN codegen reads this → generates NativeBRouterSpec   │
├─ Android bridge ─────────────────────────────────────────┤
│  • ReadableMap crosses the JS→Java bridge                │
│  • Promise crosses back with String or rejection         │
├─ NativeBRouterSpec (generated) ──────────────────────────┤
│  • Abstract class: getRoute(ReadableMap, Promise)         │
│  • BRouterModule extends this                            │
├─ BRouterModule.java ─────────────────────────────────────┤
│  • Validates waypoint keys exist                         │
│  • ParamMapper.toBundle(params) → Bundle                 │
│  • BRouterClient.getRoute(bundle) → String               │
│  • Maps exceptions → promise.reject(code, message)       │
├─ ParamMapper.java ───────────────────────────────────────┤
│  • Iterates ReadableMap keys                             │
│  • Converts JS types → Android Bundle types              │
│  • All ~25 AIDL keys mapped here                         │
├─ BRouterClient.java ─────────────────────────────────────┤
│  • Manages ServiceConnection lifecycle                   │
│  • connect(): bind + poll until service process starts   │
│  • getService(): transparent reconnect on binder death   │
│  • getRoute(): calls IBRouterService.getTrackFromParams()│
├─ BRouterServiceConnection.java ──────────────────────────┤
│  • Implements Android ServiceConnection                  │
│  • Binds to btools.routingapp.BRouterService             │
│  • volatile brouterService field (AIDL stub)             │
├─ IBRouterService.aidl ───────────────────────────────────┤
│  • AIDL contract copied from upstream BRouter            │
│  • String getTrackFromParams(in Bundle params)           │
├─ BRouter Android app (external) ─────────────────────────┤
│  • Installed separately on the device                    │
│  • Computes route from OpenStreetMap data                │
│  • Returns GPX/KML/JSON track string                     │
└──────────────────────────────────────────────────────────┘
```

## Serialization flow

### Waypoints

```
JS: Waypoint[]                           Android: Bundle
[{ position: [lng, lat], name?, direct? }]
      │                                        ▲
      ├─ serializeWaypoints()                  │
      │  lonlats: "lng,lat[,name][,d]|..." ────┤ putString("lonlats", ...)
      │  lats:    [lat, lat, ...]        ──────┤ putDoubleArray("lats", ...)
      │  lons:    [lng, lng, ...]        ──────┤ putDoubleArray("lons", ...)
      │  straight: "idx,..." (optional)  ──────┤ putString("straight", ...)
      ▼                                        │
ReadableMap (flat key-value) ──── ParamMapper.toBundle() ───┘
```

### Other params (examples)

| JS field | JS type | Wire key | Bundle type |
|---|---|---|---|
| `vehicle` | `'motorcar'\|'bicycle'\|'foot'` | `v` | `String` |
| `fast` | `boolean` | `fast` | `int` (0/1) |
| `format` | `'gpx'\|'kml'\|'json'` | `trackFormat` | `String` |
| `elevation` | `boolean` | `engineMode` | `int` (2 if true) |
| `turnInstructionMode` | `'none'\|...\|'locus-old'` | `timode` | `int` (0–7) |
| `maxRunningTime` | `number` | `maxRunningTime` | `String` (seconds) |
| `extraParams` | `Record<string,string>` | `extraParams` | `Bundle` |

## Error flow

```
BRouter app error / exception
      │
      ▼
BRouterClient.getRoute() throws IllegalStateException(code)
      │
      ▼
BRouterModule.getRoute() — catch (Exception e)
      │
      ├─ IllegalStateException → extract error code from message
      ├─ track == null          → ROUTING_FAILED
      ├─ validation fail        → INVALID_PARAMS
      └─ other                  → UNKNOWN
      │
      ▼
promise.reject(code, message)
      │
      ▼
JS: error.code, error.message → BRouterError
```

## Threading

- **JS thread**: async/await, non-blocking
- **React Native bridge thread**: synchronous `getRoute()` call — the entire connect + route computation blocks this thread
- **BRouterClient.connect() polling**: sleep-loop on bridge thread (not main thread)
- **BRouterServiceConnection callbacks**: `onServiceConnected`/`onServiceDisconnected` run on Android main thread → `volatile` field ensures visibility
- **invalidate()**: called on main thread, `disconnect()` is synchronized but doesn't block (poll loop is outside the monitor)
