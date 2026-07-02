/**
 * Tests for the GeoJSON abstraction layer (react-native-brouter/geojson).
 */

import { getRoute, polygonToNogoAreas } from '../geojson/index';
import type { RouteSummary } from '../geojson/index';
import NativeBRouter from '../NativeBRouter';

jest.mock('../NativeBRouter', () => ({
	__esModule: true,
	default: { getRoute: jest.fn() },
}));

const mockGetRoute = (NativeBRouter as unknown as { getRoute: jest.Mock })
	.getRoute;

describe('geojson/getRoute', () => {
	beforeEach(() => {
		mockGetRoute.mockClear();
	});

	// ── Waypoint conversion ───────────────────────────────────────

	it('converts GeoJSON Position[] to core waypoints', async () => {
		mockGetRoute.mockResolvedValue('<gpx>...</gpx>');

		await getRoute({
			waypoints: [
				[10, 20],
				[30, 40],
				[50, 60],
			],
		});

		expect(mockGetRoute).toHaveBeenCalledTimes(1);
		const params = mockGetRoute.mock.calls[0]![0] as Record<
			string,
			unknown
		>;
		expect(params.lonlats).toBe('10,20|30,40|50,60');
	});

	// ── Vehicle / profile passthrough ─────────────────────────────

	it('passes through vehicle and fast options', async () => {
		mockGetRoute.mockResolvedValue('<gpx>...</gpx>');

		await getRoute({
			waypoints: [
				[10, 20],
				[30, 40],
			],
			vehicle: 'foot',
			fast: true,
		});

		const params = mockGetRoute.mock.calls[0]![0] as Record<
			string,
			unknown
		>;
		expect(params.v).toBe('foot');
		expect(params.fast).toBe(1);
	});

	it('passes through profile name', async () => {
		mockGetRoute.mockResolvedValue('<gpx>...</gpx>');

		await getRoute({
			waypoints: [
				[10, 20],
				[30, 40],
			],
			profile: 'trekking.brf',
		});

		const params = mockGetRoute.mock.calls[0]![0] as Record<
			string,
			unknown
		>;
		expect(params.profile).toBe('trekking');
	});

	// ── Nogo areas passthrough ────────────────────────────────────

	it('passes through nogo areas', async () => {
		mockGetRoute.mockResolvedValue('<gpx>...</gpx>');

		await getRoute({
			waypoints: [
				[10, 20],
				[30, 40],
			],
			nogos: [{ position: [15, 25], radiusMeters: 500 }],
		});

		const params = mockGetRoute.mock.calls[0]![0] as Record<
			string,
			unknown
		>;
		expect(params.nogos).toBe('15,25,500');
	});

	// ── GeoJSONRouteResult shape ──────────────────────────────────

	it('returns GeoJSONRouteResult with raw and format', async () => {
		mockGetRoute.mockResolvedValue('<gpx>...</gpx>');

		const result = await getRoute({
			waypoints: [
				[10, 20],
				[30, 40],
			],
		});

		expect(result).toEqual({
			raw: '<gpx>...</gpx>',
			format: 'gpx',
		});
	});

	// ── JSON parsing ──────────────────────────────────────────────

	it('parses JSON result into typed GeoJSON when format is json', async () => {
		const jsonTrack = JSON.stringify([
			{
				type: 'Feature',
				geometry: {
					type: 'LineString',
					coordinates: [
						[10, 20],
						[10.1, 20.1],
						[10.2, 20.2],
					],
				},
				properties: {
					'track-length': 15000,
					'total-time': 3600,
					'filtered ascend': 200,
					'plain-descent': 150,
				},
			},
		]);

		mockGetRoute.mockResolvedValue(jsonTrack);

		const result = await getRoute({
			waypoints: [
				[10, 20],
				[10.2, 20.2],
			],
			format: 'json',
		});

		expect(result.format).toBe('json');
		expect(result.raw).toBe(jsonTrack);
		expect(result.parsed).toBeDefined();
		expect(result.parsed!.track.type).toBe('FeatureCollection');
		expect(result.parsed!.track.features).toHaveLength(1);
		expect(result.parsed!.track.features[0]!.geometry.type).toBe(
			'LineString'
		);
		expect(result.parsed!.waypoints.type).toBe('FeatureCollection');
		expect(result.parsed!.waypoints.features).toHaveLength(2);
		expect(result.parsed!.summary).toEqual({
			totalDistanceMeters: 15000,
			totalDurationSeconds: 3600,
			ascentMeters: 200,
			descentMeters: 150,
			trackPointCount: 3,
		} satisfies RouteSummary);
	});

	// ── Error passthrough ─────────────────────────────────────────

	it('rejects with validation error for < 2 waypoints', async () => {
		await expect(
			getRoute({
				waypoints: [[10, 20]],
			})
		).rejects.toEqual({
			code: 'INVALID_PARAMS',
			message: 'At least 2 waypoints are required',
		});
	});
});

describe('polygonToNogoAreas', () => {
	it('converts a simple Polygon to NogoArea[]', () => {
		const result = polygonToNogoAreas({
			type: 'Polygon',
			coordinates: [
				[
					[10, 20],
					[10.1, 20],
					[10.1, 20.1],
					[10, 20.1],
					[10, 20],
				],
			],
		});

		expect(result).toHaveLength(1);
		expect(result[0]!.position[0]).toBeCloseTo(10.05, 1);
		expect(result[0]!.position[1]).toBeCloseTo(20.05, 1);
		expect(result[0]!.radiusMeters).toBeGreaterThan(0);
		expect(result[0]!.weight).toBeUndefined();
	});

	it('passes through the weight parameter', () => {
		const result = polygonToNogoAreas(
			{
				type: 'Polygon',
				coordinates: [
					[
						[10, 20],
						[10.1, 20],
						[10.1, 20.1],
						[10, 20.1],
						[10, 20],
					],
				],
			},
			5
		);

		expect(result[0]!.weight).toBe(5);
	});

	it('handles MultiPolygon by returning one NogoArea per polygon', () => {
		const result = polygonToNogoAreas({
			type: 'MultiPolygon',
			coordinates: [
				[
					[
						[10, 20],
						[10.01, 20],
						[10.01, 20.01],
						[10, 20.01],
						[10, 20],
					],
				],
				[
					[
						[30, 40],
						[30.01, 40],
						[30.01, 40.01],
						[30, 40.01],
						[30, 40],
					],
				],
			],
		});

		expect(result).toHaveLength(2);
	});
});
