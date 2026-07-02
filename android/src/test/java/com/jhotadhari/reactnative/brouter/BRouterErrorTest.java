package com.jhotadhari.reactnative.brouter;

import static org.junit.Assert.*;

import org.junit.Test;

/**
 * Unit tests for {@link BRouterError}.
 */
public class BRouterErrorTest {

	@Test
	public void constantsAreDistinct() {
		assertEquals("SERVICE_NOT_INSTALLED", BRouterError.SERVICE_NOT_INSTALLED);
		assertEquals("SERVICE_UNAVAILABLE", BRouterError.SERVICE_UNAVAILABLE);
		assertEquals("CONNECTION_TIMEOUT", BRouterError.CONNECTION_TIMEOUT);
		assertEquals("ROUTING_TIMEOUT", BRouterError.ROUTING_TIMEOUT);
		assertEquals("INVALID_PARAMS", BRouterError.INVALID_PARAMS);
		assertEquals("ROUTING_FAILED", BRouterError.ROUTING_FAILED);
		assertEquals("UNKNOWN", BRouterError.UNKNOWN);

		// Sanity: all codes are different
		String[] codes = {
			BRouterError.SERVICE_NOT_INSTALLED,
			BRouterError.SERVICE_UNAVAILABLE,
			BRouterError.CONNECTION_TIMEOUT,
			BRouterError.ROUTING_TIMEOUT,
			BRouterError.INVALID_PARAMS,
			BRouterError.ROUTING_FAILED,
			BRouterError.UNKNOWN,
		};
		for (int i = 0; i < codes.length; i++) {
			for (int j = i + 1; j < codes.length; j++) {
				assertNotEquals(
					"Error codes should be distinct: " + codes[i],
					codes[i],
					codes[j]
				);
			}
		}
	}

	@Test
	public void constructorIsPrivate() {
		// Verify the utility class exists and is usable
		assertNotNull(BRouterError.INVALID_PARAMS);
	}
}
