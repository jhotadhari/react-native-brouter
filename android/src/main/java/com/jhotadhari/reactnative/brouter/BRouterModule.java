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

	public BRouterModule( ReactApplicationContext reactContext ) {
		super( reactContext );
	}

	@NonNull
	@Override
	public String getName() {
		return NAME;
	}

	/**
	 * Return the BRouter client, creating it lazily if necessary.
	 *
	 * <p>Synchronized so two concurrent {@code getRoute()} calls cannot
	 * race and create duplicate clients (each with its own active
	 * {@code ServiceConnection} binding).
	 *
	 * <p>If the client already exists and the caller passes a different
	 * {@code connectTimeout}, the old client is disconnected and a fresh
	 * one is created — per-request timeouts are supported rather than
	 * being locked to the first call's value.
	 */
	@NonNull
	synchronized BRouterClient getClient( @NonNull ReadableMap params ) {
		int timeout = params.hasKey( "connectTimeout" )
			? params.getInt( "connectTimeout" )
			: DEFAULT_CONNECT_TIMEOUT_MS;

		if ( client != null ) {
			if ( client.getConnectTimeoutMs() != timeout ) {
				client.disconnect();
				client = null;
			}
		}

		if ( client == null ) {
			client = new BRouterClient( getReactApplicationContext(), timeout );
		}
		return client;
	}

	@Override
	public void getRoute( @NonNull ReadableMap params, @NonNull Promise promise ) {
		try {
			// Validate waypoints
			if ( ! params.hasKey( "lonlats" ) || ! params.hasKey( "lats" ) || ! params.hasKey( "lons" ) ) {
				promise.reject(
					BRouterError.INVALID_PARAMS,
					"At least 2 waypoints are required"
				);
				return;
			}

			// Build the AIDL Bundle
			Bundle brouterParams = ParamMapper.toBundle( params );

			// Use client.getRoute() which handles transparent reconnect
			// on binder death — the raw service reference is never exposed.
			BRouterClient brouterClient = getClient( params );
			String track = brouterClient.getRoute( brouterParams );

			if ( track == null ) {
				promise.reject(
					BRouterError.ROUTING_FAILED,
					"No route found between the given waypoints"
				);
				return;
			}

			promise.resolve( track );
		} catch ( Exception e ) {
			e.printStackTrace();

			// Map known error codes from BRouterClient.getLastError()
			String code = BRouterError.UNKNOWN;
			String message = e.toString();

			if ( e instanceof IllegalStateException ) {
				String detail = e.getMessage();
				if ( detail != null ) {
					// BRouterClient.getRoute() passes the error code as the
					// exception message when the service is unavailable.
					if ( detail.equals( BRouterError.SERVICE_NOT_INSTALLED )
						|| detail.equals( BRouterError.CONNECTION_TIMEOUT )
						|| detail.equals( BRouterError.SERVICE_UNAVAILABLE ) ) {
						code = detail;
						message = detail.equals( BRouterError.SERVICE_NOT_INSTALLED )
							? "The BRouter app is not installed on this device"
							: detail.equals( BRouterError.CONNECTION_TIMEOUT )
								? "Timed out waiting for the BRouter service to start"
								: "BRouter service is not available";
					}
				}
			}

			promise.reject( code, message );
		}
	}

	@Override
	public void invalidate() {
		if ( client != null ) {
			client.disconnect();
			client = null;
		}
		super.invalidate();
	}
}
