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
	 * The error code from the most recent failed {@link #connect()} call,
	 * or {@code null} if the last connection attempt succeeded.
	 */
	@Nullable
	private String lastError;

	/**
	 * @param ctx              Android context used to bind the BRouter service.
	 * @param connectTimeoutMs maximum time (ms) to wait for the service process
	 *                         to start. Default 1000.
	 */
	public BRouterClient( @NonNull Context ctx, int connectTimeoutMs ) {
		this.ctx = ctx.getApplicationContext();
		this.connectTimeoutMs = connectTimeoutMs;
	}

	/**
	 * Bind to the BRouter service and wait for it to become available.
	 *
	 * <p>Safe to call multiple times — if already connected this is a no-op.
	 *
	 * <p>The early-return / connection-creation path is synchronized, but the
	 * polling loop runs outside the monitor so that a main-thread
	 * {@link #disconnect()} (via {@code invalidate()}) is not blocked.
	 *
	 * @return the AIDL service interface, or {@code null} if the connection
	 *         could not be established.  Call {@link #getLastError()} for
	 *         the specific failure code.
	 */
	@Nullable
	public IBRouterService connect() {
		BRouterServiceConnection localConn;

		synchronized ( this ) {
			if ( connection != null ) {
				IBRouterService svc = connection.getBRouterService();
				if ( svc != null && svc.asBinder().isBinderAlive() ) {
					lastError = null;
					return svc;
				}
				// Binder died — reconnect below
				disconnect();
			}

			connection = BRouterServiceConnection.connect( ctx );
			if ( connection == null ) {
				lastError = BRouterError.SERVICE_NOT_INSTALLED;
				return null;
			}
			localConn = connection;
		}

		// Poll until the service process starts, or timeout.
		// Pattern copied from OsmAnd — the service process needs time to start
		// after the bind intent fires, and there is no callback for "process ready".
		// Polling runs OUTSIDE the synchronized block so that a main-thread
		// invalidate() -> disconnect() can proceed without blocking.
		int i = 0;
		try {
			while ( localConn.getBRouterService() == null && i * 100 < connectTimeoutMs ) {
				Thread.sleep( 100 );
				i += 1;
			}
		} catch ( InterruptedException e ) {
			Thread.currentThread().interrupt();
			lastError = BRouterError.CONNECTION_TIMEOUT;
			disconnect();
			return null;
		} catch ( Exception e ) {
			e.printStackTrace();
			lastError = BRouterError.UNKNOWN;
			disconnect();
			return null;
		}

		if ( localConn.getBRouterService() == null ) {
			lastError = BRouterError.CONNECTION_TIMEOUT;
			disconnect();
			return null;
		}

		lastError = null;
		return localConn.getBRouterService();
	}

	/**
	 * Return the error code from the most recent failed {@link #connect()}
	 * call, or {@code null} if the last connection attempt succeeded.
	 *
	 * <p>Use this after {@link #connect()} returns {@code null} (or
	 * {@link #getRoute} throws) to distinguish "app not installed" from a
	 * transient connection timeout.
	 */
	@Nullable
	public String getLastError() {
		return lastError;
	}

	/**
	 * Return the connection timeout in milliseconds.
	 */
	public int getConnectTimeoutMs() {
		return connectTimeoutMs;
	}

	/**
	 * Return the current service interface, reconnecting transparently if the
	 * binder has died.
	 *
	 * <p>Copied pattern from OsmAnd's {@code getBRouterService()}.
	 */
	@Nullable
	public synchronized IBRouterService getService() {
		if ( connection == null ) {
			return connect();
		}
		IBRouterService service = connection.getBRouterService();
		if ( service == null ) {
			return connect();
		}
		if ( ! service.asBinder().isBinderAlive() ) {
			return connect();
		}
		lastError = null;
		return service;
	}

	/**
	 * Call the BRouter service with the given parameter bundle.
	 *
	 * @param params the Bundle produced by {@link ParamMapper#toBundle}.
	 * @return the track result string, or {@code null} if routing failed.
	 * @throws IllegalStateException if the service is unavailable (call
	 *         {@link #getLastError()} for the specific error code).
	 * @throws Exception if the AIDL call itself fails.
	 */
	@Nullable
	public String getRoute( @NonNull android.os.Bundle params ) throws Exception {
		IBRouterService service = getService();
		if ( service == null ) {
			String code = lastError != null ? lastError : BRouterError.SERVICE_UNAVAILABLE;
			throw new IllegalStateException( code );
		}
		return service.getTrackFromParams( params );
	}

	/**
	 * Whether the service is currently connected and alive.
	 */
	public synchronized boolean isConnected() {
		if ( connection == null ) {
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
		if ( connection != null ) {
			try {
				connection.disconnect( ctx );
			} catch ( Exception e ) {
				// Best-effort cleanup — the context may already be gone.
			}
			connection = null;
		}
	}
}
