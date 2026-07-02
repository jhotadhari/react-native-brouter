package com.jhotadhari.reactnative.brouter;

import android.os.Bundle;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.module.annotations.ReactModule;

import btools.routingapp.IBRouterService;

@ReactModule(name = BRouterModule.NAME)
public class BRouterModule extends NativeBRouterSpec {

	public static final String NAME = "BRouter";

	private static final int DEFAULT_CONNECT_TIMEOUT_MS = 1000;

	@Nullable
	BRouterClient client;

	public BRouterModule(ReactApplicationContext reactContext) {
		super(reactContext);
	}

	@NonNull
	@Override
	public String getName() {
		return NAME;
	}

	/**
	 * Lazy-init the BRouter client. Uses {@code connectTimeout} from the
	 * request params on first call; falls back to a 1000 ms default.
	 */
	@NonNull
	BRouterClient getClient(@NonNull ReadableMap params) {
		if (client == null) {
			int timeout = params.hasKey("connectTimeout")
				? params.getInt("connectTimeout")
				: DEFAULT_CONNECT_TIMEOUT_MS;
			client = new BRouterClient(getReactApplicationContext(), timeout);
		}
		return client;
	}

	@Override
	public void getRoute(@NonNull ReadableMap params, @NonNull Promise promise) {
		try {
			// Validate waypoints
			if (!params.hasKey("lonlats") || !params.hasKey("lats") || !params.hasKey("lons")) {
				promise.reject(
					BRouterError.INVALID_PARAMS,
					"At least 2 waypoints are required"
				);
				return;
			}

			// Build the AIDL Bundle
			Bundle brouterParams = ParamMapper.toBundle(params);

			// Connect and call
			BRouterClient brouterClient = getClient(params);
			IBRouterService service = brouterClient.connect();

			if (service == null) {
				promise.reject(
					BRouterError.SERVICE_UNAVAILABLE,
					"BRouter service is not available"
				);
				return;
			}

			String track = service.getTrackFromParams(brouterParams);

			if (track == null) {
				promise.reject(
					BRouterError.ROUTING_FAILED,
					"No route found between the given waypoints"
				);
				return;
			}

			promise.resolve(track);
		} catch (Exception e) {
			e.printStackTrace();
			promise.reject(
				BRouterError.UNKNOWN,
				e.toString()
			);
		}
	}

	@Override
	public void invalidate() {
		if (client != null) {
			client.disconnect();
			client = null;
		}
		super.invalidate();
	}
}
