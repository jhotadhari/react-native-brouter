package com.jhotadhari.reactnative.brouter;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.ReactContext;

import btools.routingapp.IBRouterService;

public class BRouterConnector {

	private final ReactContext ctx;

	private final int connectTimeout;

	private static BRouterConnector single_instance = null;

	public static synchronized BRouterConnector getInstance( ReactContext ctx , int connectTimeout ) {
		if ( single_instance == null ) {
			single_instance = new BRouterConnector( ctx, connectTimeout );
		}
		return single_instance;
	}

	protected BRouterServiceConnection bRouterServiceConnection;

	private BRouterConnector( ReactContext ctx, int connectTimeout ) {
		this.ctx = ctx;
		this.connectTimeout = connectTimeout;
		reconnectToBRouter();
	}

	/**
	 * Copy of https://github.com/osmandapp/OsmAnd/blob/40b2e3eb9e2104c8908a25390cc6fe79bc21591f/OsmAnd/src/net/osmand/plus/OsmandApplication.java#L899
	 * Changed delay to a loop.
	 */
	@Nullable
	public synchronized IBRouterService reconnectToBRouter() {
		try {
			bRouterServiceConnection = BRouterServiceConnection.connect( ctx );
			// a delay is necessary as the service process needs time to start.
			int i = 0;
			try {
				while ( null == bRouterServiceConnection.getBRouterService() && i * 100 < connectTimeout ) {
					Thread.sleep(100 );
					i += 1;
				}
			} catch ( Exception e ) {
				e.printStackTrace();
			}
			if ( bRouterServiceConnection != null ) {
				return bRouterServiceConnection.getBRouterService();
			}
		} catch ( Exception e ) {
			e.printStackTrace();
		}
		return null;
	}

	/**
	 * Copy of https://github.com/osmandapp/OsmAnd/blob/40b2e3eb9e2104c8908a25390cc6fe79bc21591f/OsmAnd/src/net/osmand/plus/OsmandApplication.java#L914
	 */
	@Nullable
	public synchronized IBRouterService getBRouterService() {
		if ( bRouterServiceConnection == null ) {
			return null;
		}
		IBRouterService service = bRouterServiceConnection.getBRouterService();
		if ( service != null && ! service.asBinder().isBinderAlive() ) {
			service = reconnectToBRouter();
		}
		return service;
	}

}
