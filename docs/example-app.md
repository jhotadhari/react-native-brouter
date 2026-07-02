# Example App

The `example/` directory contains a React Native New Architecture (Fabric/TurboModules) app used to manually exercise the library.

## Running

```sh
# From repo root
yarn example start     # start Metro bundler
yarn example android   # build & run on connected device/emulator
```

Verify New Architecture is active by checking Metro logs for `"fabric":true`. Without it, TurboModule behavior won't reflect reality.

## App structure

```
example/src/
├── App.tsx                  # Category browser → example picker
├── types.ts                 # Example interface
├── sharedDeps.ts            # formatActionError, sharedStyles
├── components/
│   └── ControlPanel.tsx     # Floating toggle → drawer sidebar
└── examples/
    ├── index.ts             # Re-exports all 6 examples
    ├── basic/               # Simplest getRoute call
    ├── geojson-waypoints/   # GeoJSON Position[] for waypoints
    ├── nogo-areas/          # Toggleable nogo zones
    ├── bike-vs-car/         # Side-by-side vehicle comparison
    ├── turn-instructions/   # 8 turn instruction modes
    └── elevation/           # Elevation data (engineMode=2)
```

## Example interface

Each example module exports an `Example` object as its **default export**:

```ts
export interface Example {
  key: string;              // unique identifier (URL-safe)
  label: string;            // display name in browser
  category: ExampleCategory; // 'basic' | 'geojson' | 'profiles' | 'advanced'
  ExampleComponent: FC<{ height: number; width: number }>;
}
```

The `ExampleComponent` receives `height` and `width` props and renders its own UI — typically a `ControlPanel` drawer for inputs and a `ScrollView` for results.

## Categories

### Basic
- **`basic`** — Simple `getRoute()` with bicycle profile, JSON format, distance/duration summary display.

### GeoJSON
- **`geojson-waypoints`** — Uses `getRoute` from `react-native-brouter/geojson` with `Position[]` waypoints. Toggles between `bicycle` and `foot` profiles. Displays parsed GeoJSON summary.

### Profiles
- **`bike-vs-car`** — Side-by-side comparison: fetches two routes (bicycle and motorcar) for the same waypoints, then displays distance/duration deltas. Shows the `formatDistance`/`formatDuration` helpers.

### Advanced
- **`nogo-areas`** — Three toggleable nogo zones (A/B/C) with configurable radii. Uses core API with `nogos: NogoArea[]`. Shows how to enable/disable exclusion zones dynamically.
- **`turn-instructions`** — Cycles through all 8 `TurnInstructionMode` values (`none` through `locus-old`). Extracts turn-by-turn instructions from BRouter JSON output.
- **`elevation`** — Toggle elevation data on/off (`engineMode=2`). Parses `totalAscent`/`totalDescent` from BRouter's messages output.

## ControlPanel

A floating toggle button (`☰ Controls`) that expands into a sidebar drawer:

```tsx
<ControlPanel width={width}>
  <ControlSection title="Section Name">
    <ControlRow>
      <Text style={sharedStyles.text}>Label</Text>
      <Switch value={enabled} onValueChange={setEnabled} />
    </ControlRow>
    <StatusLine label="Status" value="done" busy={false} />
  </ControlSection>
</ControlPanel>
```

Components:
- `ControlPanel` — the drawer shell, receives `width` and optional `maxHeight`
- `ControlSection` — a labeled group, optional `title`
- `ControlRow` — horizontal flex row with wrapping
- `StatusLine` — label/value pair, with optional `busy` state

## Shared utilities

### `formatActionError(e: unknown): string`
Converts any error to a human-readable string:
- `BRouterError` → `"CODE: message"`
- `Error` instance → `e.message`
- Primitive → `String(e)`

### `sharedStyles`
```ts
export const sharedStyles = StyleSheet.create({
  text: { color: '#fff' },
});
```

## Adding a new example

1. Create `example/src/examples/my-example/index.tsx`
2. Export an `Example` object as the **default export**:
   ```ts
   import type { Example } from '../../types';
   
   const MyComponent: FC<{ height: number; width: number }> = ({ height, width }) => (
     <View style={{ height, width }}>{/* ... */}</View>
   );
   
   const example: Example = {
     key: 'my-example',
     label: 'My Example',
     category: 'advanced',  // 'basic' | 'geojson' | 'profiles' | 'advanced'
     ExampleComponent: MyComponent,
   };
   
   export default example;
   ```
3. Add to `example/src/examples/index.ts`:
   ```ts
   import myExample from './my-example';
   export { ..., myExample };
   ```
4. The example will automatically appear in the category browser

## Hardware back button

The app intercepts Android's hardware/gesture back button when viewing an example — pressing back returns to the category browser instead of exiting the app. On the home screen, the default behavior (exit app) is preserved.
