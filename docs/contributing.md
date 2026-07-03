# Contributing

## Setup

```sh
git clone https://github.com/jhotadhari/react-native-brouter.git
cd react-native-brouter
yarn                    # install all workspace dependencies
```

The repo is a Yarn workspaces monorepo. **Use Yarn, not npm.**

## Development workflow

### JS/TS changes

1. Edit files in `src/`
2. Run `yarn typecheck` — must pass
3. Run `yarn lint` — must have 0 errors (warnings for pre-existing example code are OK)
4. Run `yarn test` — all 36 Jest tests must pass
5. JS changes are picked up by the example app without rebuilding (Metro hot reload)

### Native (Java/Kotlin/AIDL) changes

1. Edit files in `android/src/main/java/...`
2. Run `yarn typecheck` + `yarn test` to verify JS side is still consistent
3. Run Java tests: `cd example/android && ./gradlew :react-native-brouter:testDebugUnitTest --no-daemon`
4. Rebuild the example app: `yarn example android` (Metro alone won't pick up native changes)

## Commands quick reference

```sh
# From repo root
yarn                      # install deps
yarn typecheck            # TypeScript check (no emit)
yarn lint                 # ESLint
yarn lint --fix           # autofix formatting issues
yarn format               # Prettier — format ALL files
yarn test                 # Jest (add path to scope to one file)
yarn prepare              # bob build (codegen + library build)
yarn example start        # Metro for example app
yarn example android      # build + run example on device

# Java tests
cd example/android && ./gradlew :react-native-brouter:testDebugUnitTest --no-daemon
```

## Adding a new AIDL parameter

1. **Verify** the key exists in `IBRouterService.aidl` comment block
2. **`src/types.ts`** — add the field to `RouteRequest` (or relevant type) with JSDoc
3. **`src/index.tsx`** — add serialization in `serializeParams()`
4. **`ParamMapper.java`** — add the mapping in `toBundle()` (use `putString`/`putDoubleArray` helpers)
5. **Tests:**
   - `src/__tests__/index.test.tsx` — test that the JS field serializes to the correct wire key
   - `ParamMapperTest.java` — test that the ReadableMap key maps to the correct Bundle entry
6. **Docs:** update `docs/aidl-params.md` with the new row

### Example: adding `fooBar` (AIDL key `foo_bar`, type `String`)

**`src/types.ts`:**
```ts
export interface RouteRequest {
  // ... existing fields ...
  /** Description of fooBar. */
  fooBar?: string;
}
```

**`src/index.tsx` `serializeParams()`:**
```ts
if (request.fooBar !== undefined) {
  params.foo_bar = request.fooBar;
}
```

**`ParamMapper.java` `toBundle()`:**
```java
putString(b, params, "foo_bar");
```

**`src/__tests__/index.test.tsx`:**
```ts
it('maps fooBar to foo_bar', async () => {
  mockGetRoute.mockResolvedValue('<gpx>...</gpx>');
  await getRoute({
    waypoints: [{ position: [10, 20] }, { position: [30, 40] }],
    fooBar: 'test-value',
  });
  const params = mockGetRoute.mock.calls[0]![0] as Record<string, unknown>;
  expect(params.foo_bar).toBe('test-value');
});
```

**`ParamMapperTest.java`:**
```java
@Test
public void mapsFooBar() {
    ReadableMap params = mock(ReadableMap.class);
    when(params.hasKey("foo_bar")).thenReturn(true);
    when(params.getString("foo_bar")).thenReturn("test-value");
    Bundle b = mock(Bundle.class);
    ParamMapper.toBundle(params, b);
    verify(b).putString("foo_bar", "test-value");
}
```

## Testing

### JS tests (Jest)

```sh
yarn test                     # all tests
yarn test -- --testPathPattern=geojson  # just geojson tests
```

Tests mock `NativeBRouter` to intercept the serialized params and verify correctness without a real device.

### Java tests (JUnit 4 + Mockito)

```sh
cd example/android && ./gradlew :react-native-brouter:testDebugUnitTest --no-daemon
```

Key patterns:
- `ReadableMap`/`ReadableArray` are pure interfaces — use `mock(ReadableMap.class)`
- `Bundle` is mocked (`mock(Bundle.class)`) because real `Bundle` requires Android runtime
- `BRouterServiceConnection.connect()` is mocked via `MockedStatic`
- `testOptions.unitTests.returnDefaultValues = true` is set in `build.gradle`

### Pre-commit hooks

Lefthook runs on commit:
- **types**: `tsc --noEmit` on staged TS/TSX files
- **lint**: `eslint` on staged JS/TS/TSX files
- **commitlint**: validates commit message format (`fix:`, `feat:`, `refactor:`, `docs:`, `test:`, `chore:`)

## Code conventions

### JS/TS
- Prettier owns formatting: tabs, `printWidth: 80`, single quotes
- Run `yarn lint --fix` or `yarn format` — don't hand-format
- `NativeBRouter.ts`: avoid TypeScript utility types (`Record`, `Pick`, etc.) — the codegen parser can't handle them

### Java/Kotlin
- **Tab-indented, space-padded-inside-parens**: `if ( params.hasKey( "v" ) )`
- Match existing formatting by hand — Java is not covered by Prettier
- `BRouterServiceConnection.java`: keep behavior in sync with OsmAnd upstream — preserve the attribution comment
- `IBRouterService.aidl`: preserve the attribution comment

### Commit messages
- Conventional Commits: `fix:`, `feat:`, `refactor:`, `docs:`, `test:`, `chore:`
- Use present tense, lowercase subject

## Architecture notes

- The library is **Android only** — the `ios/` directory is a scaffold artifact, not functional
- Two API layers: Core (`react-native-brouter`) and GeoJSON (`react-native-brouter/geojson`)
- Serialization is split: JS serializes domain types → flat key-value map, Java passes through to Bundle
- `BRouterClient` is instance-based (not singleton) — each `BRouterModule` owns one client
- All AIDL key translation lives in `ParamMapper.java` — it's the single source of truth for key names
- See `docs/architecture.md` for the full data flow
