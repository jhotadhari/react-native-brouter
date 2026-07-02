/**
 * Mirrors GeoJSON's `Position` (`[lng, lat, alt?]`).
 *
 * This is the same convention used by react-native-mapsforge-vtm.
 * Uses `number` for general TypeScript compatibility; codegen specs
 * should redeclare with `Double` where needed.
 */
export type Position = ReadonlyArray<number>;

export type VehicleMode = 'motorcar' | 'bicycle' | 'foot';

export type TrackFormat = 'kml' | 'gpx' | 'json';

export type TurnInstructionFormat = 'osmand' | 'locus';

export type TurnInstructionMode =
	| 'none'
	| 'auto-choose'
	| 'locus'
	| 'osmand'
	| 'comment'
	| 'gpsies'
	| 'orux'
	| 'locus-old';

export interface Waypoint {
	/** [lng, lat, alt?] */
	position: Position;
	/** Named waypoints are preserved in the output and not optimized away. */
	name?: string;
	/** Route as a straight line from the previous waypoint to this one. */
	direct?: boolean;
}

export interface NogoArea {
	/** [lng, lat] of the nogo center. */
	position: Position;
	/** Radius in meters. */
	radiusMeters: number;
	/** Penalty weight (optional). */
	weight?: number;
}

export interface Polyline {
	/** Array of [lng, lat]* positions. */
	positions: Position[];
	/** Penalty weight (optional). */
	weight?: number;
}

export interface Polygon {
	/** Closed ring of [lng, lat]* positions. */
	positions: Position[];
	/** Penalty weight (optional). */
	weight?: number;
}

export interface Poi {
	/** [lng, lat] */
	position: Position;
	name: string;
}

export interface RouteRequest {
	/** At least 2 waypoints required. */
	waypoints: Waypoint[];
	/** BRouter profile file name without .brf extension. */
	profile?: string;
	/** Raw profile content that overrides profile + vehicle + fast. */
	remoteProfile?: string;
	vehicle?: VehicleMode;
	/** Fast mode (ignored if remoteProfile is set). */
	fast?: boolean;
	format?: TrackFormat;
	alternativeIndex?: 0 | 1 | 2 | 3;
	nogos?: NogoArea[];
	polylines?: Polyline[];
	polygons?: Polygon[];
	pois?: Poi[];
	exportWaypoints?: boolean;
	turnInstructionFormat?: TurnInstructionFormat;
	turnInstructionMode?: TurnInstructionMode;
	/** Start direction in degrees. */
	heading?: number;
	/** Recalculation start direction in degrees. */
	direction?: number;
	/** Request elevation data (engineMode=2). */
	elevation?: boolean;
	/** Routing timeout in seconds (default 60). */
	maxRunningTime?: number;
	/** Connection timeout in milliseconds (default 1000). */
	connectTimeout?: number;
	/** Save result to file instead of returning it in the promise. */
	pathToFileResult?: string;
	/** Compress result (gpx format only). */
	acceptCompressedResult?: boolean;
	/** Arbitrary key=value pairs passed to the BRouter profile. */
	extraParams?: Record<string, string>;
}

export interface RouteResult {
	/** The raw track string (GPX, KML, or JSON). */
	raw: string;
	/** The format of the returned track. */
	format: TrackFormat;
}

/** Structured error from the BRouter native module. */
export interface BRouterError {
	code: string;
	message: string;
}
