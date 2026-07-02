package com.jhotadhari.reactnative.brouter;

import android.content.Context;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import btools.routingapp.IBRouterService;

/**
 * Manages the bind lifecycle to the external BRouter Android app's AIDL service.
 *
 * <p>This replaces the previous {@code BRouterConnector} singleton with an
 * instance-based design — each {@link BRouterModule} owns one client, keyed
 * to its {@code ReactContext}, so connection timeouts and lifecycle are
 * scoped correctly.
 *
 * <p>The bind-and-poll pattern is derived from OsmAnd's
 * {@code BRouterServiceConnection} usage (the polling loop is necessary
 * because the external service process needs time to start after the bind
 * intent is sent).
 */
public class BRouterClient {

	private final Context ctx;
	private final int connectTimeoutMs;

	@Nullable
	private BRouterServiceConnection connection;

	/**
	 * @param ctx              Android context used to bind the BRouter service.
	 * @param connectTimeoutMs maximum time (ms) to wait for the service process
	 *                         to start. Default 1000.
	 */
	public BRouterClient(@NonNull Context ctx, int connectTimeoutMs) {
		this.ctx = ctx.getApplicationContext();
		this.connectTimeoutMs = connectTimeoutMs;
	}

	/**
	 * Bind to the BRouter service and wait for it to become available.
	 *
	 * <p>Safe to call multiple times — if already connected this is a no-op.
	 *
	 * @return the AIDL service interface, or {@code null} if the connection
	 *         could not be established.
	 */
	@Nullable
	public synchronized IBRouterService connect() {
		if (connection != null) {
			IBRouterService svc = connection.getBRouterService();
			if (svc != null && svc.asBinder().isBinderAlive()) {
				return svc;
			}
			// Binder died — reconnect below
			disconnect();
		}

		connection = BRouterServiceConnection.connect(ctx);
		if (connection == null) {
			return null;
		}

		// Poll until the service process starts, or timeout.
		// Pattern copied from OsmAnd — the service process needs time to start
		// after the bind intent fires, and there is no callback for "process ready".
		int i = 0;
		try {
			while (connection.getBRouterService() == null && i * 100 < connectTimeoutMs) {
				Thread.sleep(100);
				i += 1;
			}
		} catch (InterruptedException e) {
			Thread.currentThread().interrupt();
			disconnect();
			return null;
		} catch (Exception e) {
			e.printStackTrace();
			disconnect();
			return null;
		}

		if (connection.getBRouterService() == null) {
			disconnect();
			return null;
		}

		return connection.getBRouterService();
	}

	/**
	 * Return the current service interface, reconnecting transparently if the
	 * binder has died.
	 *
	 * <p>Copied pattern from OsmAnd's {@code getBRouterService()}.
	 */
	@Nullable
	public synchronized IBRouterService getService() {
		if (connection == null) {
			return connect();
		}
		IBRouterService service = connection.getBRouterService();
		if (service == null) {
			return connect();
		}
		if (!service.asBinder().isBinderAlive()) {
			return connect();
		}
		return service;
	}

	/**
	 * Call the BRouter service with the given parameter bundle.
	 *
	 * @param params the Bundle produced by {@link ParamMapper#toBundle}.
	 * @return the track result string, or {@code null} if routing failed.
	 * @throws Exception if the service is unavailable or the call fails.
	 */
	@Nullable
	public String getRoute(@NonNull android.os.Bundle params) throws Exception {
		IBRouterService service = getService();
		if (service == null) {
			throw new IllegalStateException("BRouter service is not available");
		}
		return service.getTrackFromParams(params);
	}

	/**
	 * Whether the service is currently connected and alive.
	 */
	public synchronized boolean isConnected() {
		if (connection == null) {
			return false;
		}
		IBRouterService svc = connection.getBRouterService();
		return svc != null && svc.asBinder().isBinderAlive();
	}

	/**
	 * Unbind from the BRouter service and release resources.
	 *
	 * <p>Safe to call multiple times. After calling this, the next
	 * {@link #connect()} will create a fresh binding.
	 */
	public synchronized void disconnect() {
		if (connection != null) {
			try {
				connection.disconnect(ctx);
			} catch (Exception e) {
				// Best-effort cleanup — the context may already be gone.
			}
			connection = null;
		}
	}
}
