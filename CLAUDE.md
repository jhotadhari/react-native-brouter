# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`react-native-brouter` is a React Native **Turbo Module for Android only** (no iOS implementation, despite the `ios/generated` scaffold from create-react-native-library). It lets a React Native app talk to the separately-installed [BRouter](https://github.com/abrensch/brouter) Android app via its AIDL service interface, for offline routing/navigation based on OpenStreetMap data. The consuming app must declare a `<queries>` entry for `btools.routingapp` in its `AndroidManifest.xml` (see README) or the service bind will silently fail.

### Two API layers

The library exports two entry points:

1. **Core API** (`react-native-brouter`) — direct typed mapping of all ~25 AIDL Bundle keys. Use when you need full control over BRouter parameters.
2. **GeoJSON API** (`react-native-brouter/geojson`) — high-level API accepting GeoJSON `Position` arrays (`[lng, lat]`), re-exports `Position` from `@types/geojson`. Works naturally with `@turf/turf`. Internally converts to core `RouteRequest` and calls the native module.

## Monorepo layout

Yarn workspaces, two packages:
- root (`/`) — the library itself
- `example/` — a React New Architecture (Fabric/TurboModules) RN app used to manually exercise the library; it links the library locally, so JS changes are picked up without rebuilding, but native (Java/Kotlin/AIDL) changes require rebuilding the example's Android app.

Use Yarn (not npm) — npm is incompatible with this Yarn-workspaces setup.

## Commands

Run from the repo root unless noted.

```sh
yarn                    # install deps for all workspaces
yarn typecheck          # tsc, no emit
yarn lint               # eslint **/*.{js,ts,tsx}
yarn lint --fix         # autofix lint/format issues
yarn format             # prettier . --write (formats all files, not just js/ts/tsx)
yarn test               # jest (single run); add a path to scope to one file
yarn prepare            # react-native-builder-bob build -> lib/ (also runs codegen)
yarn example start      # start Metro for the example app
yarn example android    # build & run the example app on a connected device/emulator
```

**Java tests** (from repo root):
```sh
cd example/android && ./gradlew :react-native-brouter:testDebugUnitTest --no-daemon
```

Verify the example app is running New Architecture by checking Metro logs for `"fabric":true` — if that's missing, TurboModule behavior won't reflect reality.

Pre-commit (lefthook) runs eslint + tsc on staged JS/TS files and validates commit messages against `@commitlint/config-conventional` (commit messages must be `fix:`, `feat:`, `refactor:`, `docs:`, `test:`, or `chore:` prefixed).

## Architecture: JS -> Codegen -> Native bridge

### JS side

1. **`src/types.ts`** — domain types: `Position`, `Waypoint`, `NogoArea`, `Polyline`, `Polygon`, `Poi`, `RouteRequest`, `RouteResult`, `BRouterError`. All exported for consumers.
2. **`src/NativeBRouter.ts`** — the codegen `Spec` (`TurboModule` interface). Defines `getRoute(params: { [key: string]: unknown }): Promise<string>`. RN codegen reads this to generate `NativeBRouterSpec.java`. Avoid generic utility types (`Record`, `Pick`, etc.) — the codegen parser doesn't support them.
3. **`src/index.tsx`** — core public API. `getRoute(request: RouteRequest): Promise<RouteResult>`. Validates input (≥2 waypoints), serializes domain types → flat key-value map (BRouter wire format: `lonlats` pipe-delimited string, `lats`/`lons` arrays, etc.), calls `NativeBRouter.getRoute()`, normalizes errors into `BRouterError { code, message }`.
4. **`src/geojson/index.ts`** — GeoJSON API. `getRoute(request: GeoJSONRouteRequest): Promise<GeoJSONRouteResult>`. Accepts `Position[]` for waypoints, converts to core `RouteRequest` internally, parses JSON results into typed `FeatureCollection`. Exported as `"react-native-brouter/geojson"` via `package.json` exports map.

### Android side

5. **`BRouterModule.java`** — extends codegen'd `NativeBRouterSpec`. Thin entry point: validates waypoints, calls `ParamMapper.toBundle()` → `BRouterClient.connect()` → `IBRouterService.getTrackFromParams()`, resolves/rejects the JS `Promise` with structured error codes from `BRouterError`.
6. **`ParamMapper.java`** — static utility converting a `ReadableMap` (flat key-value from JS serialization) into an Android `Bundle` matching `IBRouterService.aidl`. Every AIDL key is mapped here — this is the single place for key name translation. Has an overload `toBundle(params, bundle)` accepting a pre-created Bundle (used for testability with mocked Bundle).
7. **`BRouterClient.java`** — instance-based (not singleton) manager for the bind lifecycle to the external BRouter app's AIDL service. Replaces the old `BRouterConnector`. Constructor takes `Context + connectTimeoutMs`. `connect()` polls (sleep-loop, same OsmAnd-derived pattern) until the service process starts. `getService()` transparently reconnects if the binder has died. `disconnect()` releases resources.
8. **`BRouterError.java`** — structured error code constants: `SERVICE_NOT_INSTALLED`, `SERVICE_UNAVAILABLE`, `CONNECTION_TIMEOUT`, `ROUTING_TIMEOUT`, `INVALID_PARAMS`, `ROUTING_FAILED`, `UNKNOWN`. Errors are surfaced as `promise.reject(code, message)` — the JS `normalizeError` reads `error.code` and `error.message`.
9. **`BRouterServiceConnection.java`** — raw `ServiceConnection` implementing bind/unbind to `btools.routingapp.BRouterService`. Marked as a direct copy of OsmAnd's implementation — keep behavior in sync with upstream rather than "fixing" things that look odd without checking the source first.
10. **`BRouterPackage.kt`** — registers `BRouterModule` with RN's module registry.
11. **`android/src/main/aidl/btools/routingapp/IBRouterService.aidl`** — the AIDL contract from upstream BRouter. The comment block is the authoritative list of all `Bundle` keys — when adding support for more params, extend `ParamMapper` and the JS types together; don't invent key names.

### Adding a new AIDL param

1. Add the field to `RouteRequest` in `src/types.ts`
2. Add serialization in `src/index.tsx` `serializeParams()`
3. Add the mapping in `ParamMapper.java` `toBundle()`
4. Add a test in both `index.test.tsx` and `ParamMapperTest.java`

After changing native Android code, rebuild the example app with `yarn example android` (Metro alone won't pick it up).

## Testing

### JS tests
- `src/__tests__/index.test.tsx` — core API: validation, serialization, defaults, error normalization (36 tests)
- `src/__tests__/geojson.test.ts` — GeoJSON layer: Position conversion, JSON parsing, polygonToNogoAreas

Mock `NativeBRouter` with `jest.mock` + `__esModule: true` for default exports.

### Java tests
- `android/src/test/java/.../ParamMapperTest.java` — verifies every AIDL key is mapped correctly (uses Mockito mocks for ReadableMap + Bundle)
- `android/src/test/java/.../BRouterErrorTest.java` — error code constants
- `android/src/test/java/.../BRouterModuleTest.java` — module logic with mocked service
- `android/src/test/java/.../BRouterClientTest.java` — connection lifecycle

Java tests use JUnit 4 + Mockito. ReadableMap/ReadableArray are pure interfaces (mockable). Bundle is mocked (real Bundle doesn't work in JVM without Robolectric).

## Conventions specific to this repo

- JS/TS formatting is owned by Prettier (`.prettierrc`: tabs, `printWidth` 80, single quotes), not by hand. ESLint's `prettier/prettier` rule has no inline options in `eslint.config.mjs` — it resolves `.prettierrc` from disk, so the two never drift. Run `yarn format` (or `yarn lint --fix`) instead of manually matching style.
- Java/Kotlin is not covered by Prettier — it keeps its own tab-indented, space-padded-inside-parens style (e.g. `if ( params.hasKey( "v" ) )`). Match existing formatting by hand in files you touch.
- `BRouterServiceConnection.java` and the AIDL file carry explicit "copy of upstream X" doc comments with source URLs. Preserve these attributions when editing.
- `package.json` has a `"//"` comment noting sub-path exports — keep it updated when adding new entry points.
- The codegen spec in `src/NativeBRouter.ts` must avoid TypeScript utility types (`Record`, `Pick`, etc.) — the codegen parser only handles basic TS syntax. Use `{ [key: string]: unknown }` instead of `Record<string, unknown>`.
