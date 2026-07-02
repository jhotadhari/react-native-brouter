/**
 * GeoJSON-friendly API for react-native-brouter.
 *
 * This layer accepts GeoJSON {@link Position} arrays for waypoints and
 * nogo areas, and returns results that integrate naturally with
 * `@turf/turf` and other GeoJSON tooling.
 *
 * ## Usage
 *
 * ```ts
 * import { getRoute } from 'react-native-brouter/geojson';
 *
 * const result = await getRoute({
 *   waypoints: [[-71.04, -13.95], [-70.90, -13.79]],
 *   vehicle: 'bicycle',
 *   format: 'json',
 * });
 * // result.parsed.track  → GeoJSON FeatureCollection
 * // result.parsed.waypoints → FeatureCollection of waypoint points
 * ```
 *
 * @module geojson
 */

import type {
	FeatureCollection,
	LineString,
	MultiPolygon,
	Point,
	Polygon,
	Position,
} from 'geojson';

import { getRoute as coreGetRoute } from '../index';
import type {
	BRouterError,
	NogoArea,
	RouteRequest,
	RouteResult,
	TrackFormat,
	VehicleMode,
	Waypoint,
} from '../types';

// Re-export GeoJSON Position so consumers don't need their own @types/geojson
export type { Position };

export type { BRouterError, RouteResult, TrackFormat, VehicleMode };

// ── GeoJSON-specific types ──────────────────────────────────────────

export interface GeoJSONRouteRequest {
	/**
	 * Waypoints as GeoJSON positions: `[[lng, lat], [lng, lat], ...]`.
	 *
	 * Works directly with turf's `lineString()`, `along()`, etc.
	 * Minimum 2 waypoints required.
	 */
	waypoints: Position[];

	/** BRouter profile file name without .brf extension. */
	profile?: string;

	/** Raw profile content (overrides profile + vehicle + fast). */
	remoteProfile?: string;

	vehicle?: VehicleMode;
	fast?: boolean;
	format?: TrackFormat;
	alternativeIndex?: 0 | 1 | 2 | 3;

	/**
	 * Nogo areas as point+radius circles.
	 *
	 * For polygon-based nogos, use {@link polygonToNogoAreas} to convert
	 * GeoJSON Polygon / MultiPolygon geometries to the nogo format.
	 */
	nogos?: NogoArea[];

	exportWaypoints?: boolean;
	heading?: number;
	direction?: number;
	elevation?: boolean;
	maxRunningTime?: number;
	connectTimeout?: number;
	pathToFileResult?: string;
	acceptCompressedResult?: boolean;
	extraParams?: Record<string, string>;
}

export interface RouteSummary {
	/** Total distance in meters (available when format is 'json'). */
	totalDistanceMeters?: number;
	/** Total duration in seconds (available when format is 'json'). */
	totalDurationSeconds?: number;
	/** Ascent in meters (available when format is 'json'). */
	ascentMeters?: number;
	/** Descent in meters (available when format is 'json'). */
	descentMeters?: number;
	/** Number of track points. */
	trackPointCount?: number;
}

export interface GeoJSONRouteResult {
	/** The raw track string (GPX, KML, or JSON). */
	raw: string;

	/** The format of the returned track. */
	format: TrackFormat;

	/**
	 * Parsed GeoJSON result (only populated when format is 'json').
	 *
	 * `track` is a FeatureCollection containing the route geometry as a
	 * LineString feature. `waypoints` contains the input waypoints as
	 * Point features. `summary` holds extracted statistics.
	 */
	parsed?: {
		track: FeatureCollection<LineString>;
		waypoints: FeatureCollection<Point>;
		summary: RouteSummary;
	};
}

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Parse a BRouter JSON track result into a typed GeoJSON structure.
 *
 * BRouter's JSON output format is a plain array of feature objects
 * (not a proper FeatureCollection). This normalizes it.
 */
function parseJsonTrack(
	raw: string,
	waypoints: Position[]
): {
	track: FeatureCollection<LineString>;
	waypoints: FeatureCollection<Point>;
	summary: RouteSummary;
} {
	const features = JSON.parse(raw) as Array<{
		type: 'Feature';
		geometry: {
			type: string;
			coordinates: unknown;
		};
		properties: Record<string, unknown>;
	}>;

	// Separate track features from waypoint features
	const trackFeatures: Array<
		FeatureCollection<LineString>['features'][number]
	> = [];
	let totalDistanceMeters: number | undefined;
	let totalDurationSeconds: number | undefined;
	let ascentMeters: number | undefined;
	let descentMeters: number | undefined;
	let trackPointCount = 0;

	for (const feature of features) {
		if (feature.geometry.type === 'LineString') {
			const coords = feature.geometry.coordinates as Position[];
			trackFeatures.push({
				type: 'Feature',
				geometry: {
					type: 'LineString',
					coordinates: coords,
				},
				properties: feature.properties,
			});
			trackPointCount += coords.length;

			// Extract summary from feature properties
			if (feature.properties['total-distance']) {
				totalDistanceMeters = Number(
					feature.properties['total-distance']
				);
			}
			if (feature.properties['total-time']) {
				totalDurationSeconds = Number(feature.properties['total-time']);
			}
			if (feature.properties['filtered ascend']) {
				ascentMeters = Number(feature.properties['filtered ascend']);
			}
			if (feature.properties['plain-descent']) {
				descentMeters = Number(feature.properties['plain-descent']);
			}
		}
	}

	const waypointFeatures: FeatureCollection<Point>['features'] =
		waypoints.map((pos, i) => ({
			type: 'Feature' as const,
			geometry: {
				type: 'Point' as const,
				coordinates: pos,
			},
			properties: { index: i },
		}));

	return {
		track: {
			type: 'FeatureCollection',
			features: trackFeatures,
		},
		waypoints: {
			type: 'FeatureCollection',
			features: waypointFeatures,
		},
		summary: {
			totalDistanceMeters,
			totalDurationSeconds,
			ascentMeters,
			descentMeters,
			trackPointCount,
		},
	};
}

// ── Public API ──────────────────────────────────────────────────────

/**
 * Request a route from the BRouter Android app using GeoJSON types.
 *
 * Converts GeoJSON {@link Position} arrays to the internal format,
 * calls the native BRouter service, and returns a result that
 * includes parsed GeoJSON structures when `format` is `'json'`.
 *
 * @throws {BRouterError} if the request is invalid or BRouter fails.
 */
export async function getRoute(
	request: GeoJSONRouteRequest
): Promise<GeoJSONRouteResult> {
	// Convert GeoJSON positions to core Waypoint[]
	const coreWaypoints: Waypoint[] = request.waypoints.map((pos) => ({
		position: [pos[0]!, pos[1]!] as [number, number],
	}));

	const coreRequest: RouteRequest = {
		waypoints: coreWaypoints,
		profile: request.profile,
		remoteProfile: request.remoteProfile,
		vehicle: request.vehicle,
		fast: request.fast,
		format: request.format,
		alternativeIndex: request.alternativeIndex,
		nogos: request.nogos,
		exportWaypoints: request.exportWaypoints,
		heading: request.heading,
		direction: request.direction,
		elevation: request.elevation,
		maxRunningTime: request.maxRunningTime,
		connectTimeout: request.connectTimeout,
		pathToFileResult: request.pathToFileResult,
		acceptCompressedResult: request.acceptCompressedResult,
		extraParams: request.extraParams,
	};

	const result: RouteResult = await coreGetRoute(coreRequest);

	const geoResult: GeoJSONRouteResult = {
		raw: result.raw,
		format: result.format,
	};

	// Parse JSON result into typed GeoJSON
	if (result.format === 'json') {
		try {
			geoResult.parsed = parseJsonTrack(result.raw, request.waypoints);
		} catch {
			// Parsing is best-effort — raw string is always available
		}
	}

	return geoResult;
}

/**
 * Convert a GeoJSON {@link Polygon} or {@link MultiPolygon} into an array
 * of {@link NogoArea} entries suitable for use in
 * {@link GeoJSONRouteRequest.nogos}.
 *
 * Uses a bounding-circle approximation: the polygon's centroid becomes
 * the nogo center, and the farthest vertex distance becomes the radius.
 *
 * This is a utility for consumers — it is not called automatically.
 *
 * ## Usage with turf
 *
 * ```ts
 * import { polygonToNogoAreas } from 'react-native-brouter/geojson';
 * import turfBboxPolygon from '@turf/bbox-polygon';
 *
 * const bboxPoly = turfBboxPolygon([lng1, lat1, lng2, lat2]);
 * const nogos = polygonToNogoAreas(bboxPoly.geometry);
 * ```
 */
export function polygonToNogoAreas(
	geometry: Polygon | MultiPolygon,
	weight?: number
): NogoArea[] {
	const result: NogoArea[] = [];

	// Normalize to an array of polygon rings
	const polygons: Position[][][] =
		geometry.type === 'Polygon'
			? [geometry.coordinates]
			: geometry.coordinates;

	for (const rings of polygons) {
		const outerRing = rings[0];
		if (!outerRing || outerRing.length === 0) {
			continue;
		}

		// Compute centroid (average of all vertices)
		let sumLng = 0;
		let sumLat = 0;
		for (const pos of outerRing) {
			sumLng += pos[0]!;
			sumLat += pos[1]!;
		}
		const centerLng = sumLng / outerRing.length;
		const centerLat = sumLat / outerRing.length;

		// Compute max distance from centroid to any vertex as radius
		let maxDist = 0;
		for (const pos of outerRing) {
			const dLng =
				(pos[0]! - centerLng) * Math.cos((centerLat * Math.PI) / 180);
			const dLat = pos[1]! - centerLat;
			// Approximate distance in meters (1 degree ≈ 111,320 m)
			const distMeters = Math.sqrt(dLng * dLng + dLat * dLat) * 111320;
			if (distMeters > maxDist) {
				maxDist = distMeters;
			}
		}

		result.push({
			position: [centerLng, centerLat],
			radiusMeters: Math.ceil(maxDist),
			weight,
		});
	}

	return result;
}
