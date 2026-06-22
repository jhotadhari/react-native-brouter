# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`react-native-brouter` is a React Native **Turbo Module for Android only** (no iOS implementation, despite the `ios/generated` scaffold from create-react-native-library). It lets a React Native app talk to the separately-installed [BRouter](https://github.com/abrensch/brouter) Android app via its AIDL service interface, for offline routing/navigation based on OpenStreetMap data. The consuming app must declare a `<queries>` entry for `btools.routingapp` in its `AndroidManifest.xml` (see README) or the service bind will silently fail.

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

Verify the example app is running New Architecture by checking Metro logs for `"fabric":true` — if that's missing, TurboModule behavior won't reflect reality.

Pre-commit (lefthook) runs eslint + tsc on staged JS/TS files and validates commit messages against `@commitlint/config-conventional` (commit messages must be `fix:`, `feat:`, `refactor:`, `docs:`, `test:`, or `chore:` prefixed).

## Architecture: JS -> Codegen -> Native bridge

Changing or adding a native method touches all of these layers, in this order:

1. **`src/NativeBRouter.ts`** — the codegen `Spec` (`TurboModule` interface) and the exported param/return types (e.g. `GetTrackParams`). This is the single source of truth for the bridge's method signatures; RN codegen reads this file to generate native interface code into `android/generated/`.
2. **`src/index.tsx`** — thin public JS API that wraps `NativeBRouter`'s `TurboModuleRegistry.getEnforcing<Spec>('BRouter')` export with friendlier function exports (e.g. `getTrackFromParams`).
3. **`android/src/main/java/.../BRouterModule.java`** — extends the codegen'd `NativeBRouterSpec`. Converts the RN `ReadableMap` params into an Android `Bundle` (`convertParams`) matching the key/type contract documented in `IBRouterService.aidl`, then calls through to the BRouter service and resolves/rejects the JS `Promise`. Errors are surfaced as a rejected promise with `{ errorMsg }`, accessed in JS as `e?.userInfo?.errorMsg`.
4. **`android/src/main/java/.../BRouterConnector.java`** — singleton that owns the bind lifecycle to the external BRouter app's Android Service. `reconnectToBRouter()` polls (sleep-loop, not a callback) for up to `connectTimeout` ms while the external service process starts, and `getBRouterService()` transparently reconnects if the binder has died. Because it's a process-wide singleton (`getInstance`), a `connectTimeout` passed on one call effectively only takes effect on first connection.
5. **`android/src/main/java/.../BRouterServiceConnection.java`** — raw `ServiceConnection` implementing the bind/unbind to BRouter's `btools.routingapp.BRouterService`. Marked as a direct copy of OsmAnd's implementation — keep behavior in sync with upstream rather than "fixing" things that look odd without checking the source first.
6. **`android/src/main/aidl/btools/routingapp/IBRouterService.aidl`** — the AIDL contract copied from the upstream BRouter app (`abrensch/brouter`). The big comment block here is the authoritative list of all `Bundle` keys the service accepts (`lonlats`, `nogos`, `profile`, `engineMode`, etc.) — only a subset is currently wired up in `BRouterModule.convertParams`. When adding support for more params, extend `convertParams` and `GetTrackParams` together; don't invent key names, they must match this AIDL doc exactly.
7. **`android/src/main/java/.../BRouterPackage.kt`** — registers `BRouterModule` with RN's module registry (`getModule`, `ReactModuleInfoProvider`). Needs a new entry here only if a new native module class is added — not needed for new methods on the existing `BRouterModule`.

After changing native Android code, the example app needs `yarn example android` rebuilt (Metro alone won't pick it up).

## Conventions specific to this repo

- JS/TS formatting is owned by Prettier (`.prettierrc`: tabs, `printWidth` 80, single quotes), not by hand. ESLint's `prettier/prettier` rule has no inline options in `eslint.config.mjs` — it resolves `.prettierrc` from disk, so the two never drift. Run `yarn format` (or `yarn lint --fix`) instead of manually matching style; don't reintroduce a prettier config block in `package.json`, `.prettierrc` is now the only source of truth.
- Java/Kotlin is not covered by Prettier — it keeps its own tab-indented, space-padded-inside-parens style (e.g. `if ( params.hasKey( "v" ) )`). Match existing formatting by hand in files you touch.
- `BRouterServiceConnection.java` and the AIDL file carry explicit "copy of upstream X" doc comments with source URLs. Preserve these attributions when editing.
