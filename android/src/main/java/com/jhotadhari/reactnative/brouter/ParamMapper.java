package com.jhotadhari.reactnative.brouter;

import android.os.Bundle;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;

import java.util.ArrayList;
import java.util.List;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

/**
 * Converts a {@link ReadableMap} (serialized from the JS {@code RouteRequest})
 * into an Android {@link Bundle} matching the key/type contract documented in
 * {@code IBRouterService.aidl}.
 *
 * <p>Every key listed in the AIDL comment block is mapped here. This is the
 * single place where JS-to-AIDL key name translation lives — adding a new
 * param means adding one field to the JS type and one {@code putX} call here.
 */
public final class ParamMapper {

	private ParamMapper() {
		// static utility — no instances
	}

	/**
	 * Convert the JS-serialized route request into a Bundle suitable for
	 * {@code IBRouterService.getTrackFromParams(Bundle)}.
	 */
	@NonNull
	public static Bundle toBundle(@NonNull ReadableMap params) {
		return toBundle(params, new Bundle());
	}

	/**
	 * Overload that writes into an existing Bundle (useful for testing
	 * with a mocked Bundle).
	 */
	@NonNull
	static Bundle toBundle(@NonNull ReadableMap params, @NonNull Bundle b) {

		// ── Waypoints ──────────────────────────────────────────────
		// JS pre-serializes waypoints into lonlats, lats, lons, straight
		putString(b, params, "lonlats");
		putDoubleArray(b, params, "lats");
		putDoubleArray(b, params, "lons");
		putString(b, params, "straight");

		// ── Profile ────────────────────────────────────────────────
		putString(b, params, "profile");
		putString(b, params, "remoteProfile");

		// ── Vehicle / speed ────────────────────────────────────────
		putString(b, params, "v");
		if (params.hasKey("fast")) {
			b.putInt("fast", params.getInt("fast"));
		}

		// ── Output format ──────────────────────────────────────────
		putString(b, params, "trackFormat");

		// ── Alternative index ──────────────────────────────────────
		if (params.hasKey("alternativeidx")) {
			b.putInt("alternativeidx", params.getInt("alternativeidx"));
		}

		// ── Export waypoints ───────────────────────────────────────
		if (params.hasKey("exportWaypoints")) {
			b.putInt("exportWaypoints", params.getInt("exportWaypoints"));
		}

		// ── Turn instructions ──────────────────────────────────────
		putString(b, params, "turnInstructionFormat");
		if (params.hasKey("timode")) {
			b.putInt("timode", params.getInt("timode"));
		}

		// ── Heading / direction ────────────────────────────────────
		if (params.hasKey("heading")) {
			b.putDouble("heading", params.getDouble("heading"));
		}
		if (params.hasKey("direction")) {
			b.putDouble("direction", params.getDouble("direction"));
		}

		// ── Engine mode (elevation) ────────────────────────────────
		if (params.hasKey("engineMode")) {
			b.putInt("engineMode", params.getInt("engineMode"));
		}

		// ── Timeout ────────────────────────────────────────────────
		if (params.hasKey("maxRunningTime")) {
			b.putInt("maxRunningTime", params.getInt("maxRunningTime"));
		}

		// ── File output ────────────────────────────────────────────
		putString(b, params, "pathToFileResult");

		// ── Compression ────────────────────────────────────────────
		if (params.hasKey("acceptCompressedResult")) {
			b.putBoolean("acceptCompressedResult", params.getBoolean("acceptCompressedResult"));
		}

		// ── Extra params (profile setup key=value) ─────────────────
		if (params.hasKey("extraParams")) {
			ReadableMap extra = params.getMap("extraParams");
			if (extra != null) {
				Bundle extraBundle = new Bundle();
				com.facebook.react.bridge.ReadableMapKeySetIterator iterator =
					extra.keySetIterator();
				while (iterator.hasNextKey()) {
					String key = iterator.nextKey();
					ReadableType type = extra.getType(key);
					if (type == ReadableType.String) {
						extraBundle.putString(key, extra.getString(key));
					} else if (type == ReadableType.Number) {
						extraBundle.putDouble(key, extra.getDouble(key));
					} else if (type == ReadableType.Boolean) {
						extraBundle.putBoolean(key, extra.getBoolean(key));
					}
				}
				b.putBundle("extraParams", extraBundle);
			}
		}

		// ── Nogo areas ─────────────────────────────────────────────
		putString(b, params, "nogos");
		putDoubleArray(b, params, "nogoLats");
		putDoubleArray(b, params, "nogoLons");
		putDoubleArray(b, params, "nogoRadi");

		// ── Polylines / polygons ──────────────────────────────────
		putString(b, params, "polylines");
		putString(b, params, "polygons");

		// ── POIs ──────────────────────────────────────────────────
		putString(b, params, "pois");

		return b;
	}

	// ── Helpers ────────────────────────────────────────────────────

	private static void putString(
		@NonNull Bundle b,
		@NonNull ReadableMap params,
		@NonNull String key
	) {
		if (params.hasKey(key)) {
			String value = params.getString(key);
			if (value != null) {
				b.putString(key, value);
			}
		}
	}

	private static void putDoubleArray(
		@NonNull Bundle b,
		@NonNull ReadableMap params,
		@NonNull String key
	) {
		if (params.hasKey(key)) {
			ReadableArray arr = params.getArray(key);
			if (arr != null && arr.size() > 0) {
				double[] doubles = new double[arr.size()];
				for (int i = 0; i < arr.size(); i++) {
					doubles[i] = arr.getDouble(i);
				}
				b.putDoubleArray(key, doubles);
			}
		}
	}
}
