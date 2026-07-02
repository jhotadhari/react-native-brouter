package com.jhotadhari.reactnative.brouter;

import static org.junit.Assert.*;
import static org.mockito.Mockito.*;

import android.os.Bundle;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.ReadableType;

import org.junit.Test;
import org.mockito.ArgumentCaptor;

/**
 * Unit tests for {@link ParamMapper}.
 */
public class ParamMapperTest {

	@Test
	public void mapsLonlats() {
		ReadableMap params = mock(ReadableMap.class);
		when(params.hasKey("lonlats")).thenReturn(true);
		when(params.getString("lonlats")).thenReturn("10,20|30,40");

		Bundle b = mock(Bundle.class);

		ParamMapper.toBundle(params, b);

		verify(b).putString("lonlats", "10,20|30,40");
	}

	@Test
	public void mapsLatsArray() {
		ReadableArray lats = mock(ReadableArray.class);
		when(lats.size()).thenReturn(2);
		when(lats.getDouble(0)).thenReturn(20.0);
		when(lats.getDouble(1)).thenReturn(40.0);

		ReadableMap params = mock(ReadableMap.class);
		when(params.hasKey("lats")).thenReturn(true);
		when(params.getArray("lats")).thenReturn(lats);

		Bundle b = mock(Bundle.class);
		ParamMapper.toBundle(params, b);

		ArgumentCaptor<double[]> captor = ArgumentCaptor.forClass(double[].class);
		verify(b).putDoubleArray(eq("lats"), captor.capture());
		assertEquals(20.0, captor.getValue()[0], 0.001);
		assertEquals(40.0, captor.getValue()[1], 0.001);
	}

	@Test
	public void mapsStraightIndices() {
		ReadableMap params = mock(ReadableMap.class);
		when(params.hasKey("straight")).thenReturn(true);
		when(params.getString("straight")).thenReturn("1,3");

		Bundle b = mock(Bundle.class);
		ParamMapper.toBundle(params, b);

		verify(b).putString("straight", "1,3");
	}

	@Test
	public void mapsProfile() {
		ReadableMap params = mock(ReadableMap.class);
		when(params.hasKey("profile")).thenReturn(true);
		when(params.getString("profile")).thenReturn("trekking");

		Bundle b = mock(Bundle.class);
		ParamMapper.toBundle(params, b);

		verify(b).putString("profile", "trekking");
	}

	@Test
	public void mapsVehicleToV() {
		ReadableMap params = mock(ReadableMap.class);
		when(params.hasKey("v")).thenReturn(true);
		when(params.getString("v")).thenReturn("bicycle");

		Bundle b = mock(Bundle.class);
		ParamMapper.toBundle(params, b);

		verify(b).putString("v", "bicycle");
	}

	@Test
	public void mapsFast() {
		ReadableMap params = mock(ReadableMap.class);
		when(params.hasKey("fast")).thenReturn(true);
		when(params.getInt("fast")).thenReturn(1);

		Bundle b = mock(Bundle.class);
		ParamMapper.toBundle(params, b);

		verify(b).putInt("fast", 1);
	}

	@Test
	public void mapsTrackFormat() {
		ReadableMap params = mock(ReadableMap.class);
		when(params.hasKey("trackFormat")).thenReturn(true);
		when(params.getString("trackFormat")).thenReturn("json");

		Bundle b = mock(Bundle.class);
		ParamMapper.toBundle(params, b);

		verify(b).putString("trackFormat", "json");
	}

	@Test
	public void mapsAlternativeidx() {
		ReadableMap params = mock(ReadableMap.class);
		when(params.hasKey("alternativeidx")).thenReturn(true);
		when(params.getInt("alternativeidx")).thenReturn(2);

		Bundle b = mock(Bundle.class);
		ParamMapper.toBundle(params, b);

		verify(b).putInt("alternativeidx", 2);
	}

	@Test
	public void mapsExportWaypoints() {
		ReadableMap params = mock(ReadableMap.class);
		when(params.hasKey("exportWaypoints")).thenReturn(true);
		when(params.getInt("exportWaypoints")).thenReturn(1);

		Bundle b = mock(Bundle.class);
		ParamMapper.toBundle(params, b);

		verify(b).putInt("exportWaypoints", 1);
	}

	@Test
	public void mapsTurnInstructionFormat() {
		ReadableMap params = mock(ReadableMap.class);
		when(params.hasKey("turnInstructionFormat")).thenReturn(true);
		when(params.getString("turnInstructionFormat")).thenReturn("osmand");

		Bundle b = mock(Bundle.class);
		ParamMapper.toBundle(params, b);

		verify(b).putString("turnInstructionFormat", "osmand");
	}

	@Test
	public void mapsTimode() {
		ReadableMap params = mock(ReadableMap.class);
		when(params.hasKey("timode")).thenReturn(true);
		when(params.getInt("timode")).thenReturn(3);

		Bundle b = mock(Bundle.class);
		ParamMapper.toBundle(params, b);

		verify(b).putInt("timode", 3);
	}

	@Test
	public void mapsHeading() {
		ReadableMap params = mock(ReadableMap.class);
		when(params.hasKey("heading")).thenReturn(true);
		when(params.getDouble("heading")).thenReturn(90.5);

		Bundle b = mock(Bundle.class);
		ParamMapper.toBundle(params, b);

		verify(b).putDouble("heading", 90.5);
	}

	@Test
	public void mapsEngineMode() {
		ReadableMap params = mock(ReadableMap.class);
		when(params.hasKey("engineMode")).thenReturn(true);
		when(params.getInt("engineMode")).thenReturn(2);

		Bundle b = mock(Bundle.class);
		ParamMapper.toBundle(params, b);

		verify(b).putInt("engineMode", 2);
	}

	@Test
	public void mapsMaxRunningTime() {
		ReadableMap params = mock(ReadableMap.class);
		when(params.hasKey("maxRunningTime")).thenReturn(true);
		when(params.getInt("maxRunningTime")).thenReturn(120);

		Bundle b = mock(Bundle.class);
		ParamMapper.toBundle(params, b);

		verify(b).putInt("maxRunningTime", 120);
	}

	@Test
	public void mapsPathToFileResult() {
		ReadableMap params = mock(ReadableMap.class);
		when(params.hasKey("pathToFileResult")).thenReturn(true);
		when(params.getString("pathToFileResult")).thenReturn("/sdcard/route.gpx");

		Bundle b = mock(Bundle.class);
		ParamMapper.toBundle(params, b);

		verify(b).putString("pathToFileResult", "/sdcard/route.gpx");
	}

	@Test
	public void mapsAcceptCompressedResult() {
		ReadableMap params = mock(ReadableMap.class);
		when(params.hasKey("acceptCompressedResult")).thenReturn(true);
		when(params.getBoolean("acceptCompressedResult")).thenReturn(true);

		Bundle b = mock(Bundle.class);
		ParamMapper.toBundle(params, b);

		verify(b).putBoolean("acceptCompressedResult", true);
	}

	@Test
	public void mapsExtraParams() {
		ReadableMap extra = mock(ReadableMap.class);
		ReadableMapKeySetIterator mockIterator = mock(ReadableMapKeySetIterator.class);
		when(mockIterator.hasNextKey()).thenReturn(true, false);
		when(mockIterator.nextKey()).thenReturn("key1");
		when(extra.keySetIterator()).thenReturn(mockIterator);
		when(extra.getType("key1")).thenReturn(ReadableType.String);
		when(extra.getString("key1")).thenReturn("value1");

		ReadableMap params = mock(ReadableMap.class);
		when(params.hasKey("extraParams")).thenReturn(true);
		when(params.getMap("extraParams")).thenReturn(extra);

		Bundle b = mock(Bundle.class);
		ParamMapper.toBundle(params, b);

		ArgumentCaptor<Bundle> captor = ArgumentCaptor.forClass(Bundle.class);
		verify(b).putBundle(eq("extraParams"), captor.capture());
		assertNotNull(captor.getValue());
	}

	@Test
	public void mapsNogos() {
		ReadableMap params = mock(ReadableMap.class);
		when(params.hasKey("nogos")).thenReturn(true);
		when(params.getString("nogos")).thenReturn("15,25,500|35,45,1000,2");

		Bundle b = mock(Bundle.class);
		ParamMapper.toBundle(params, b);

		verify(b).putString("nogos", "15,25,500|35,45,1000,2");
	}

	@Test
	public void mapsPolylines() {
		ReadableMap params = mock(ReadableMap.class);
		when(params.hasKey("polylines")).thenReturn(true);
		when(params.getString("polylines")).thenReturn("15,25,16,26");

		Bundle b = mock(Bundle.class);
		ParamMapper.toBundle(params, b);

		verify(b).putString("polylines", "15,25,16,26");
	}

	@Test
	public void mapsPois() {
		ReadableMap params = mock(ReadableMap.class);
		when(params.hasKey("pois")).thenReturn(true);
		when(params.getString("pois")).thenReturn("15,25,Cafe");

		Bundle b = mock(Bundle.class);
		ParamMapper.toBundle(params, b);

		verify(b).putString("pois", "15,25,Cafe");
	}
}
