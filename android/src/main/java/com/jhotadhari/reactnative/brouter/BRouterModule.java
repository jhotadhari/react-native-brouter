package com.jhotadhari.reactnative.brouter;

import android.os.Bundle;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.module.annotations.ReactModule;

import btools.routingapp.IBRouterService;

@ReactModule(name = BRouterModule.NAME)
public class BRouterModule extends NativeBRouterSpec {

	public static final String NAME = "BRouter";

	public BRouterModule(ReactApplicationContext reactContext) {
		super(reactContext);
	}

	@NonNull
	@Override
	public String getName() {
		return NAME;
	}

	protected static Bundle convertParams( ReadableMap params ) {
		Bundle brouterParams = new Bundle();
		if ( params.hasKey( "maxRunningTime" ) ) {
			brouterParams.putInt( "maxRunningTime", params.getInt( "maxRunningTime" ) );
		}
		if ( params.hasKey( "trackFormat" ) ) {
			brouterParams.putString( "trackFormat", params.getString( "trackFormat" ) );
		}
		if ( params.hasKey( "fast" ) ) {
			brouterParams.putInt( "fast", params.getBoolean( "fast" ) ? 1 : 0 );
		}
		if ( params.hasKey( "v" ) ) {
			brouterParams.putString( "v", params.getString( "v" ) );
		}
		if ( params.hasKey( "lonlats" ) ) {
			brouterParams.putString( "lonlats", params.getString( "lonlats" ) );
		}
		return brouterParams;
	}

	public void getTrackFromParams( ReadableMap params, Promise promise ) {
		WritableMap error = new WritableNativeMap();
		try {
			BRouterConnector brouterConnector = BRouterConnector.getInstance(
				getReactApplicationContext(),
				params.hasKey( "connectTimeout" ) ? params.getInt( "connectTimeout" ) : 1000
			);
			IBRouterService brouterService = brouterConnector.getBRouterService();
			if ( brouterService == null ) {
				error.putString( "errorMsg", "BRouter service is not available" );
				promise.reject( "error", error );
			}
			String track = brouterService.getTrackFromParams( convertParams( params ) );
			promise.resolve( track );
		} catch ( Exception e ) {
			e.printStackTrace();
			error.putString( "errorMsg", e.toString() );
			promise.reject( "error", error );
		}
	}
}
