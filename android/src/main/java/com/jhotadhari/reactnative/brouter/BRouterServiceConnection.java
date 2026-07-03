package com.jhotadhari.reactnative.brouter;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.IBinder;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import btools.routingapp.IBRouterService;

/**
 * Copy of https://github.com/osmandapp/OsmAnd/blob/master/OsmAnd/src/btools/routingapp/BRouterServiceConnection.java
 */
public class BRouterServiceConnection implements ServiceConnection {

	private volatile IBRouterService brouterService;

	public void onServiceConnected(ComponentName className, IBinder boundService) {
		brouterService = IBRouterService.Stub.asInterface(boundService);
	}

	public void onServiceDisconnected(ComponentName className) {
		brouterService = null;
	}

	public void disconnect(@NonNull Context ctx) {
		ctx.unbindService(this);
	}

	@Nullable
	public IBRouterService getBRouterService() {
		return brouterService;
	}

	@Nullable
	public static BRouterServiceConnection connect( @NonNull Context ctx ) {
		BRouterServiceConnection conn = new BRouterServiceConnection();
		Intent intent = new Intent();
		intent.setClassName("btools.routingapp", "btools.routingapp.BRouterService");
		boolean hasBRouter = ctx.bindService(
			intent,
			conn,
			Context.BIND_AUTO_CREATE
		);
		if ( ! hasBRouter ) {
			conn = null;
		}
		return conn;
	}
}

