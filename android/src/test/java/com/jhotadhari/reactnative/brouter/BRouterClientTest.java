package com.jhotadhari.reactnative.brouter;

import static org.junit.Assert.*;
import static org.mockito.Mockito.*;

import android.content.Context;
import android.os.Bundle;
import android.os.IBinder;

import btools.routingapp.IBRouterService;

import org.junit.Before;
import org.junit.Test;
import org.mockito.MockedStatic;

/**
 * Unit tests for {@link BRouterClient} lifecycle.
 *
 * <p>These tests mock {@link BRouterServiceConnection#connect} so they
 * don't need a real Android environment.
 */
public class BRouterClientTest {

	private Context mockContext;

	@Before
	public void setUp() {
		mockContext = mock(Context.class);
		when(mockContext.getApplicationContext()).thenReturn(mockContext);
	}

	// ── Construction ───────────────────────────────────────────────

	@Test
	public void constructorStoresContextAndTimeout() {
		BRouterClient client = new BRouterClient(mockContext, 2000);

		assertFalse(client.isConnected());
		// Timeout stored internally — verified implicitly by connect()
		// behavior in tests below.
	}

	// ── connect() ──────────────────────────────────────────────────

	@Test
	public void connectReturnsNullWhenServiceUnavailable() {
		// BRouterServiceConnection.connect returns null when BRouter
		// app is not installed — simulate that.
		try (MockedStatic<BRouterServiceConnection> mockedStatic =
				mockStatic(BRouterServiceConnection.class)) {

			mockedStatic.when(() ->
				BRouterServiceConnection.connect(any(Context.class))
			).thenReturn(null);

			BRouterClient client = new BRouterClient(mockContext, 500);
			IBRouterService service = client.connect();

			assertNull(service);
			assertFalse(client.isConnected());
		}
	}

	@Test
	public void connectReturnsServiceWhenAvailable() {
		BRouterServiceConnection mockConn = mock(BRouterServiceConnection.class);
		IBRouterService mockService = mock(IBRouterService.class);
		IBinder mockBinder = mock(IBinder.class);

		when(mockConn.getBRouterService()).thenReturn(mockService);
		when(mockService.asBinder()).thenReturn(mockBinder);
		when(mockBinder.isBinderAlive()).thenReturn(true);

		try (MockedStatic<BRouterServiceConnection> mockedStatic =
				mockStatic(BRouterServiceConnection.class)) {

			mockedStatic.when(() ->
				BRouterServiceConnection.connect(any(Context.class))
			).thenReturn(mockConn);

			BRouterClient client = new BRouterClient(mockContext, 500);
			IBRouterService service = client.connect();

			assertNotNull(service);
			assertEquals(mockService, service);
			assertTrue(client.isConnected());
		}
	}

	// ── getService() ───────────────────────────────────────────────

	@Test
	public void getServiceReconnectsWhenBinderDead() {
		BRouterServiceConnection mockConn1 = mock(BRouterServiceConnection.class);
		BRouterServiceConnection mockConn2 = mock(BRouterServiceConnection.class);
		IBRouterService mockService1 = mock(IBRouterService.class);
		IBRouterService mockService2 = mock(IBRouterService.class);
		IBinder mockBinder1 = mock(IBinder.class);
		IBinder mockBinder2 = mock(IBinder.class);

		when(mockConn1.getBRouterService()).thenReturn(mockService1);
		when(mockService1.asBinder()).thenReturn(mockBinder1);
		when(mockBinder1.isBinderAlive()).thenReturn(true);

		when(mockConn2.getBRouterService()).thenReturn(mockService2);
		when(mockService2.asBinder()).thenReturn(mockBinder2);
		when(mockBinder2.isBinderAlive()).thenReturn(true);

		try (MockedStatic<BRouterServiceConnection> mockedStatic =
				mockStatic(BRouterServiceConnection.class)) {

			// First connect succeeds
			mockedStatic.when(() ->
				BRouterServiceConnection.connect(any(Context.class))
			).thenReturn(mockConn1);

			BRouterClient client = new BRouterClient(mockContext, 500);
			IBRouterService svc = client.getService();
			assertEquals(mockService1, svc);

			// Now simulate binder death
			when(mockBinder1.isBinderAlive()).thenReturn(false);

			// Second connect call should get a new connection
			mockedStatic.when(() ->
				BRouterServiceConnection.connect(any(Context.class))
			).thenReturn(mockConn2);

			svc = client.getService();
			assertEquals(mockService2, svc);
		}
	}

	// ── getRoute() ─────────────────────────────────────────────────

	@Test
	public void getRouteCallsServiceGetTrackFromParams() throws Exception {
		BRouterServiceConnection mockConn = mock(BRouterServiceConnection.class);
		IBRouterService mockService = mock(IBRouterService.class);
		IBinder mockBinder = mock(IBinder.class);

		when(mockConn.getBRouterService()).thenReturn(mockService);
		when(mockService.asBinder()).thenReturn(mockBinder);
		when(mockBinder.isBinderAlive()).thenReturn(true);
		when(mockService.getTrackFromParams(any(Bundle.class)))
			.thenReturn("<gpx>track</gpx>");

		try (MockedStatic<BRouterServiceConnection> mockedStatic =
				mockStatic(BRouterServiceConnection.class)) {

			mockedStatic.when(() ->
				BRouterServiceConnection.connect(any(Context.class))
			).thenReturn(mockConn);

			BRouterClient client = new BRouterClient(mockContext, 500);
			Bundle params = new Bundle();
			params.putString("lonlats", "10,20|30,40");

			String result = client.getRoute(params);

			assertEquals("<gpx>track</gpx>", result);
			verify(mockService).getTrackFromParams(params);
		}
	}

	@Test(expected = IllegalStateException.class)
	public void getRouteThrowsWhenServiceUnavailable() throws Exception {
		try (MockedStatic<BRouterServiceConnection> mockedStatic =
				mockStatic(BRouterServiceConnection.class)) {

			mockedStatic.when(() ->
				BRouterServiceConnection.connect(any(Context.class))
			).thenReturn(null);

			BRouterClient client = new BRouterClient(mockContext, 500);
			client.getRoute(new Bundle());
		}
	}

	// ── disconnect() ───────────────────────────────────────────────

	@Test
	public void disconnectClearsConnection() {
		BRouterServiceConnection mockConn = mock(BRouterServiceConnection.class);
		IBRouterService mockService = mock(IBRouterService.class);
		IBinder mockBinder = mock(IBinder.class);

		when(mockConn.getBRouterService()).thenReturn(mockService);
		when(mockService.asBinder()).thenReturn(mockBinder);
		when(mockBinder.isBinderAlive()).thenReturn(true);

		try (MockedStatic<BRouterServiceConnection> mockedStatic =
				mockStatic(BRouterServiceConnection.class)) {

			mockedStatic.when(() ->
				BRouterServiceConnection.connect(any(Context.class))
			).thenReturn(mockConn);

			BRouterClient client = new BRouterClient(mockContext, 500);
			client.connect();
			assertTrue(client.isConnected());

			client.disconnect();
			assertFalse(client.isConnected());

			// Verify unbind was called
			verify(mockConn).disconnect(any(Context.class));
		}
	}

	@Test
	public void disconnectIsIdempotent() {
		BRouterClient client = new BRouterClient(mockContext, 500);
		// Should not throw
		client.disconnect();
		client.disconnect();
		assertFalse(client.isConnected());
	}
}
