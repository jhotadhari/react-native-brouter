import NativeBRouter from './NativeBRouter';
import type {
	BRouterError,
	RouteRequest,
	RouteResult,
	TrackFormat,
} from './types';

export type {
	Position,
	Waypoint,
	NogoArea,
	Polyline,
	Polygon,
	Poi,
	VehicleMode,
	TrackFormat,
	TurnInstructionFormat,
	TurnInstructionMode,
	RouteRequest,
	RouteResult,
	BRouterError,
} from './types';

const TURN_INSTRUCTION_MODE_MAP: Record<string, number> = {
	none: 0,
	'auto-choose': 1,
	locus: 2,
	osmand: 3,
	comment: 4,
	gpsies: 5,
	orux: 6,
	'locus-old': 7,
};

/**
 * Serialize waypoints into the BRouter wire format.
 *
 * Produces three AIDL keys:
 * - `lonlats`: `lng,lat[,name][,d]|...` pipe-delimited string
 * - `lats`: double[] of latitudes
 * - `lons`: double[] of longitudes
 * - `straight`: comma-separated indices of direct-routing waypoints (if any)
 */
function serializeWaypoints(
	waypoints: RouteRequest['waypoints']
): Record<string, unknown> {
	const parts: string[] = [];
	const lats: number[] = [];
	const lons: number[] = [];
	const directIndices: number[] = [];

	for (let i = 0; i < waypoints.length; i++) {
		const wp = waypoints[i]!;
		const lng = wp.position[0] as number;
		const lat = wp.position[1] as number;

		let part = `${lng},${lat}`;
		if (wp.name) {
			part += `,${wp.name}`;
		}
		if (wp.direct) {
			part += ',d';
			directIndices.push(i);
		}

		parts.push(part);
		lats.push(lat);
		lons.push(lng);
	}

	const result: Record<string, unknown> = {
		lonlats: parts.join('|'),
		lats,
		lons,
	};

	if (directIndices.length > 0) {
		result.straight = directIndices.join(',');
	}

	return result;
}

/**
 * Serialize nogo areas into the BRouter wire format.
 *
 * Produces AIDL keys:
 * - `nogos`: `lng,lat,radius[,weight]|...` pipe-delimited string
 * - `nogoLats`: double[] of nogo center latitudes
 * - `nogoLons`: double[] of nogo center longitudes
 * - `nogoRadi`: double[] of nogo radii
 */
function serializeNogos(nogos: RouteRequest['nogos']): Record<string, unknown> {
	if (!nogos || nogos.length === 0) {
		return {};
	}

	const parts: string[] = [];
	const nogoLats: number[] = [];
	const nogoLons: number[] = [];
	const nogoRadi: number[] = [];

	for (let ni = 0; ni < nogos.length; ni++) {
		const nogo = nogos[ni]!;
		const lng = nogo.position[0] as number;
		const lat = nogo.position[1] as number;
		let part = `${lng},${lat},${nogo.radiusMeters}`;
		if (nogo.weight !== undefined) {
			part += `,${nogo.weight}`;
		}

		parts.push(part);
		nogoLats.push(lat);
		nogoLons.push(lng);
		nogoRadi.push(nogo.radiusMeters);
	}

	return {
		nogos: parts.join('|'),
		nogoLats,
		nogoLons,
		nogoRadi,
	};
}

/**
 * Serialize polylines into the BRouter wire format.
 *
 * Produces: `lng,lat,lng,lat,...,weight|lng,lat,...|...`
 */
function serializePolylines(
	polylines: RouteRequest['polylines']
): string | undefined {
	if (!polylines || polylines.length === 0) {
		return undefined;
	}

	return polylines
		.map((pl) => {
			const coords = pl.positions.map((p) => `${p[0]},${p[1]}`).join(',');
			return pl.weight !== undefined ? `${coords},${pl.weight}` : coords;
		})
		.join('|');
}

/**
 * Serialize polygons into the BRouter wire format (same as polylines).
 */
function serializePolygons(
	polygons: RouteRequest['polygons']
): string | undefined {
	if (!polygons || polygons.length === 0) {
		return undefined;
	}

	return polygons
		.map((pg) => {
			const coords = pg.positions.map((p) => `${p[0]},${p[1]}`).join(',');
			return pg.weight !== undefined ? `${coords},${pg.weight}` : coords;
		})
		.join('|');
}

/**
 * Serialize pois into the BRouter wire format.
 *
 * Produces: `lng,lat,name|lng,lat,name|...`
 */
function serializePois(pois: RouteRequest['pois']): string | undefined {
	if (!pois || pois.length === 0) {
		return undefined;
	}

	return pois
		.map((poi) => `${poi.position[0]},${poi.position[1]},${poi.name}`)
		.join('|');
}

/**
 * Serialize a RouteRequest into the flat key-value map expected by the
 * Android native module's ParamMapper.
 */
function serializeParams(
	request: RouteRequest
): Readonly<Record<string, unknown>> {
	const params: Record<string, unknown> = {};

	// Waypoints (required, already validated)
	Object.assign(params, serializeWaypoints(request.waypoints));

	// Profile
	if (request.profile) {
		// Strip .brf extension if present
		params.profile = request.profile.replace(/\.brf$/, '');
	}
	if (request.remoteProfile) {
		params.remoteProfile = request.remoteProfile;
	}

	// Vehicle mode
	if (request.vehicle) {
		params.v = request.vehicle;
	}

	// Fast mode
	if (request.fast !== undefined) {
		params.fast = request.fast ? 1 : 0;
	}

	// Track format
	if (request.format) {
		params.trackFormat = request.format;
	}

	// Alternative index
	if (request.alternativeIndex !== undefined) {
		params.alternativeidx = request.alternativeIndex;
	}

	// Export waypoints
	if (request.exportWaypoints) {
		params.exportWaypoints = 1;
	}

	// Turn instruction format
	if (request.turnInstructionFormat) {
		params.turnInstructionFormat = request.turnInstructionFormat;
	}

	// Turn instruction mode (enum → int)
	if (request.turnInstructionMode) {
		const mode = TURN_INSTRUCTION_MODE_MAP[request.turnInstructionMode];
		if (mode !== undefined) {
			params.timode = mode;
		}
	}

	// Heading / direction
	if (request.heading !== undefined) {
		params.heading = request.heading;
	}
	if (request.direction !== undefined) {
		params.direction = request.direction;
	}

	// Elevation (engineMode)
	if (request.elevation) {
		params.engineMode = 2;
	}

	// Max running time
	if (request.maxRunningTime !== undefined) {
		params.maxRunningTime = request.maxRunningTime;
	}

	// Connection timeout (not AIDL, used by BRouterClient)
	if (request.connectTimeout !== undefined) {
		params.connectTimeout = request.connectTimeout;
	}

	// File output
	if (request.pathToFileResult) {
		params.pathToFileResult = request.pathToFileResult;
	}

	// Compression
	if (request.acceptCompressedResult) {
		params.acceptCompressedResult = true;
	}

	// Extra params
	if (request.extraParams) {
		params.extraParams = request.extraParams;
	}

	// Nogo areas
	if (request.nogos && request.nogos.length > 0) {
		Object.assign(params, serializeNogos(request.nogos));
	}

	// Polylines
	const polylinesStr = serializePolylines(request.polylines);
	if (polylinesStr) {
		params.polylines = polylinesStr;
	}

	// Polygons
	const polygonsStr = serializePolygons(request.polygons);
	if (polygonsStr) {
		params.polygons = polygonsStr;
	}

	// POIs
	const poisStr = serializePois(request.pois);
	if (poisStr) {
		params.pois = poisStr;
	}

	return params;
}

/**
 * Extract a structured error from a native module rejection.
 *
 * Native rejections come through as `{ code: string, message: string }`
 * from {@code Promise.reject(code, message)}.
 */
function normalizeError(e: unknown): BRouterError {
	const err = e as Record<string, unknown> | undefined;
	return {
		code: (err?.code as string) ?? 'UNKNOWN',
		message: (err?.message as string) ?? String(e),
	};
}

/**
 * Check whether the BRouter Android app is installed on this device.
 *
 * Performs a quick package-resolution check without starting the BRouter
 * service process.  Safe to call at any time — it does not affect
 * in-progress routing requests.
 *
 * @returns `true` if the BRouter app appears to be installed, `false` otherwise.
 */
export async function isAvailable(): Promise<boolean> {
	try {
		return await NativeBRouter.isAvailable();
	} catch {
		return false;
	}
}

/**
 * Request a route from the BRouter Android app.
 *
 * This is the core API entry point. It validates the request, serializes
 * it into the AIDL wire format, calls the native module, and returns a
 * typed {@link RouteResult}.
 *
 * @throws {BRouterError} if the request is invalid or BRouter fails.
 */
export async function getRoute(request: RouteRequest): Promise<RouteResult> {
	// Validate
	if (!request.waypoints || request.waypoints.length < 2) {
		throw {
			code: 'INVALID_PARAMS',
			message: 'At least 2 waypoints are required',
		} satisfies BRouterError;
	}

	const format: TrackFormat = request.format ?? 'gpx';
	const params = serializeParams(request);

	try {
		const raw = await NativeBRouter.getRoute(params);
		return { raw, format };
	} catch (e: unknown) {
		throw normalizeError(e);
	}
}
