package com.jhotadhari.reactnative.brouter;

/**
 * Structured error codes for the BRouter native module.
 *
 * <p>Each error code maps to a distinct failure scenario so that JS consumers
 * can react programmatically (e.g. prompt the user to install BRouter vs.
 * retry a transient connection failure).
 *
 * <p>Errors are passed to JS via {@code promise.reject(code, message)}.
 */
public final class BRouterError {

	/** The BRouter Android app is not installed on the device. */
	public static final String SERVICE_NOT_INSTALLED = "SERVICE_NOT_INSTALLED";

	/** Bound to the BRouter process but could not obtain the AIDL interface. */
	public static final String SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE";

	/** The BRouter service process did not start within the connect timeout. */
	public static final String CONNECTION_TIMEOUT = "CONNECTION_TIMEOUT";

	/** The routing calculation exceeded {@code maxRunningTime}. */
	public static final String ROUTING_TIMEOUT = "ROUTING_TIMEOUT";

	/** The request parameters are invalid (e.g. fewer than 2 waypoints). */
	public static final String INVALID_PARAMS = "INVALID_PARAMS";

	/** BRouter could not find a route between the given waypoints. */
	public static final String ROUTING_FAILED = "ROUTING_FAILED";

	/** An unexpected error occurred. See the message for details. */
	public static final String UNKNOWN = "UNKNOWN";

	private BRouterError() {
		// static constants only
	}
}
