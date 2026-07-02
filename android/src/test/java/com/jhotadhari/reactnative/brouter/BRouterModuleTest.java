package com.jhotadhari.reactnative.brouter;

import static org.junit.Assert.*;
import static org.mockito.Mockito.*;

import android.os.Bundle;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;

import btools.routingapp.IBRouterService;

import org.junit.Before;
import org.junit.Test;

public class BRouterModuleTest {

	private ReactApplicationContext mockReactContext;
	private BRouterClient mockClient;
	private IBRouterService mockService;

	@Before
	public void setUp() {
		mockReactContext = mock(ReactApplicationContext.class);
		when(mockReactContext.getApplicationContext()).thenReturn(mockReactContext);
		mockClient = mock(BRouterClient.class);
		mockService = mock(IBRouterService.class);
	}

	private BRouterModule createSpy() {
		BRouterModule module = new BRouterModule(mockReactContext);
		BRouterModule spy = spy(module);
		doReturn(mockClient).when(spy).getClient(any(ReadableMap.class));
		return spy;
	}

	private ReadableMap validParams() {
		ReadableArray arr = mock(ReadableArray.class);
		when(arr.size()).thenReturn(2);
		when(arr.getDouble(0)).thenReturn(10.0);
		when(arr.getDouble(1)).thenReturn(30.0);

		ReadableArray lats = mock(ReadableArray.class);
		when(lats.size()).thenReturn(2);
		when(lats.getDouble(0)).thenReturn(20.0);
		when(lats.getDouble(1)).thenReturn(40.0);

		ReadableMap params = mock(ReadableMap.class);
		when(params.hasKey("lonlats")).thenReturn(true);
		when(params.getString("lonlats")).thenReturn("10,20|30,40");
		when(params.hasKey("lats")).thenReturn(true);
		when(params.getArray("lats")).thenReturn(lats);
		when(params.hasKey("lons")).thenReturn(true);
		when(params.getArray("lons")).thenReturn(arr);

		return params;
	}

	@Test
	public void rejectsWhenLonlatsMissing() {
		BRouterModule spy = createSpy();
		ReadableMap params = mock(ReadableMap.class);
		Promise mp = mock(Promise.class);
		spy.getRoute(params, mp);
		verify(mp).reject(BRouterError.INVALID_PARAMS, "At least 2 waypoints are required");
	}

	@Test
	public void rejectsWhenServiceUnavailable() {
		when(mockClient.connect()).thenReturn(null);
		BRouterModule spy = createSpy();
		Promise mp = mock(Promise.class);
		spy.getRoute(validParams(), mp);
		verify(mp).reject(eq(BRouterError.SERVICE_UNAVAILABLE), anyString());
	}

	@Test
	public void resolvesWithTrackOnSuccess() throws Exception {
		when(mockClient.connect()).thenReturn(mockService);
		when(mockService.getTrackFromParams(any(Bundle.class))).thenReturn("<gpx>track</gpx>");
		BRouterModule spy = createSpy();
		Promise mp = mock(Promise.class);
		spy.getRoute(validParams(), mp);
		verify(mp).resolve("<gpx>track</gpx>");
	}

	@Test
	public void rejectsWhenRouteReturnsNull() throws Exception {
		when(mockClient.connect()).thenReturn(mockService);
		when(mockService.getTrackFromParams(any(Bundle.class))).thenReturn(null);
		BRouterModule spy = createSpy();
		Promise mp = mock(Promise.class);
		spy.getRoute(validParams(), mp);
		verify(mp).reject(eq(BRouterError.ROUTING_FAILED), anyString());
	}

	@Test
	public void rejectsOnUnexpectedException() {
		when(mockClient.connect()).thenThrow(new RuntimeException("Boom"));
		BRouterModule spy = createSpy();
		Promise mp = mock(Promise.class);
		spy.getRoute(validParams(), mp);
		verify(mp).reject(eq(BRouterError.UNKNOWN), anyString());
	}

	@Test
	public void invalidateDisconnectsClient() {
		// Use a subclass that injects the mock client directly into the field
		BRouterModule module = new BRouterModule(mockReactContext) {
			{
				// Set via the package-private field (same package in test)
				this.client = mockClient;
			}
		};

		module.invalidate();
		verify(mockClient).disconnect();
	}
}
