# Error Codes

All error codes the library can surface to JS consumers via `BRouterError.code`.

## Error shape

```ts
interface BRouterError {
  code: string;     // one of the codes below
  message: string;  // human-readable description
}
```

```ts
try {
  await getRoute({ waypoints: [...] });
} catch (e) {
  const err = e as BRouterError;
  switch (err.code) {
    case 'SERVICE_NOT_INSTALLED': /* ... */ break;
    case 'SERVICE_UNAVAILABLE':   /* ... */ break;
    case 'CONNECTION_TIMEOUT':    /* ... */ break;
    // ...
  }
}
```

## Error codes

### `SERVICE_NOT_INSTALLED`

**The BRouter Android app is not installed on the device.**

- **Cause:** `bindService()` to `btools.routingapp.BRouterService` returned `false`
- **Likely scenario:** User hasn't installed the BRouter app from F-Droid or GitHub
- **Remedy:** Prompt the user to install BRouter; verify the `<queries>` entry in `AndroidManifest.xml`
- **Retry?** No — won't resolve without user action

### `SERVICE_UNAVAILABLE`

**The BRouter service process could not be reached or the AIDL interface is null.**

- **Cause:** Bound to the service process but `getBRouterService()` returned `null` after connection
- **Likely scenario:** BRouter app is installed but the service process crashed or is in a bad state
- **Remedy:** Retry after a short delay; check device logs for BRouter app crash traces
- **Retry?** Yes — transient, may resolve on retry

### `CONNECTION_TIMEOUT`

**The BRouter service process did not start within the configured `connectTimeout`.**

- **Cause:** Polling loop (`Thread.sleep(100)` × iterations) exhausted without the service becoming available
- **Likely scenario:** Device under heavy load, BRouter app initializing its data files (first launch can be slow), or `connectTimeout` is too low
- **Remedy:** Increase `connectTimeout` (e.g. from 1000ms to 5000ms); check that BRouter has storage permission to read its map data
- **Retry?** Yes — may resolve once BRouter finishes initialization

### `ROUTING_TIMEOUT`

**⚠️ Defined but not currently surfaced.** The routing computation exceeded `maxRunningTime`.

- **Cause:** BRouter took longer than the configured `maxRunningTime` (default 60s) to compute the route
- **Likely scenario:** Very long route, complex nogo areas, or low-end device
- **Remedy:** Increase `maxRunningTime` or simplify the route (fewer waypoints, fewer nogos)
- **Note:** This code is defined in `BRouterError.java` for future use. Currently, BRouter handles its own timeout internally and returns a null/error result.

### `INVALID_PARAMS`

**The request parameters are invalid.**

- **Cause:** Fewer than 2 waypoints provided
- **Likely scenario:** Logic error in the calling code — a waypoint list was built dynamically and came up short
- **Remedy:** Ensure `waypoints.length >= 2` before calling `getRoute()`
- **Retry?** No — fix the input

### `ROUTING_FAILED`

**BRouter could not find a route between the given waypoints.**

- **Cause:** `IBRouterService.getTrackFromParams()` returned `null`
- **Likely scenario:** No routable path exists (e.g. waypoints on different continents, all paths blocked by nogos, waypoints on water with `vehicle: 'bicycle'`)
- **Remedy:** Adjust waypoints, remove or shrink nogo areas, try a different vehicle mode
- **Retry?** Maybe — if the route is impossible, retrying won't help; if BRouter's data is incomplete, a profile change might work

### `UNKNOWN`

**An unexpected exception occurred.**

- **Cause:** Any `Exception` caught by the top-level `try/catch` in `BRouterModule.getRoute()` that doesn't match a known error code
- **Likely scenario:** Programming error in the library, AIDL marshalling failure, `DeadObjectException` from binder death, or unexpected BRouter behavior
- **Remedy:** Check device logs for the stack trace (the exception is printed via `e.printStackTrace()`)
- **Retry?** Yes — may be transient

## Error code lifecycle

```
BRouterServiceConnection.connect() returns null
  → lastError = SERVICE_NOT_INSTALLED
  → BRouterClient.getRoute() throws IllegalStateException("SERVICE_NOT_INSTALLED")
  → BRouterModule catch → promise.reject("SERVICE_NOT_INSTALLED", ...)

BRouterClient.connect() poll loop times out
  → lastError = CONNECTION_TIMEOUT
  → BRouterClient.getRoute() throws IllegalStateException("CONNECTION_TIMEOUT")
  → BRouterModule catch → promise.reject("CONNECTION_TIMEOUT", ...)

getService() returns null (other cases)
  → lastError = null → fallback to SERVICE_UNAVAILABLE
  → BRouterClient.getRoute() throws IllegalStateException("SERVICE_UNAVAILABLE")
  → BRouterModule catch → promise.reject("SERVICE_UNAVAILABLE", ...)

IBRouterService.getTrackFromParams() returns null
  → promise.reject("ROUTING_FAILED", ...)

Params missing lonlats/lats/lons
  → promise.reject("INVALID_PARAMS", ...)

Any other Exception
  → promise.reject("UNKNOWN", ...)
```

## Distinguishing errors in the example app

The example app's `formatActionError()` helper produces human-readable strings:

```ts
// BRouterError → "SERVICE_NOT_INSTALLED: The BRouter app is not installed"
// Error       → "Some error message"
// string      → "raw error string"
```

Use `err.code` for programmatic handling and `err.message` (or `formatActionError(err)`) for display.
