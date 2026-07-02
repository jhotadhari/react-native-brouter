import { getRoute } from '../index';
import NativeBRouter from '../NativeBRouter';

jest.mock('../NativeBRouter', () => ({
	__esModule: true,
	default: { getRoute: jest.fn() },
}));

const mockGetRoute = (NativeBRouter as unknown as { getRoute: jest.Mock })
	.getRoute;

describe('getRoute', () => {
	beforeEach(() => {
		mockGetRoute.mockClear();
	});

	// ── Validation ───────────────────────────────────────────────

	it('rejects with INVALID_PARAMS if fewer than 2 waypoints', async () => {
		await expect(
			getRoute({
				waypoints: [{ position: [10, 20] }],
			})
		).rejects.toEqual({
			code: 'INVALID_PARAMS',
			message: 'At least 2 waypoints are required',
		});
	});

	it('rejects with INVALID_PARAMS if waypoints array is empty', async () => {
		await expect(
			getRoute({
				waypoints: [],
			})
		).rejects.toEqual({
			code: 'INVALID_PARAMS',
			message: 'At least 2 waypoints are required',
		});
	});

	// ── Defaults ──────────────────────────────────────────────────

	it('defaults format to gpx', async () => {
		mockGetRoute.mockResolvedValue('<gpx>...</gpx>');

		const result = await getRoute({
			waypoints: [
				{ position: [10, 20] },
				{ position: [30, 40] },
			],
		});

		expect(result.format).toBe('gpx');
	});

	// ── Waypoint serialization ────────────────────────────────────

	it('serializes waypoints into lonlats, lats, and lons', async () => {
		mockGetRoute.mockResolvedValue('<gpx>...</gpx>');

		await getRoute({
			waypoints: [
				{ position: [10, 20] },
				{ position: [30, 40] },
			],
		});

		expect(mockGetRoute).toHaveBeenCalledTimes(1);
		const params = mockGetRoute.mock.calls[0]![0] as Record<
			string,
			unknown
		>;

		expect(params.lonlats).toBe('10,20|30,40');
		expect(params.lats).toEqual([20, 40]);
		expect(params.lons).toEqual([10, 30]);
	});

	it('includes name in lonlats when waypoint has a name', async () => {
		mockGetRoute.mockResolvedValue('<gpx>...</gpx>');

		await getRoute({
			waypoints: [
				{ position: [10, 20], name: 'start' },
				{ position: [30, 40] },
			],
		});

		const params = mockGetRoute.mock.calls[0]![0] as Record<
			string,
			unknown
		>;
		expect(params.lonlats).toBe('10,20,start|30,40');
	});

	it('includes direct indices in straight field', async () => {
		mockGetRoute.mockResolvedValue('<gpx>...</gpx>');

		await getRoute({
			waypoints: [
				{ position: [10, 20] },
				{ position: [30, 40], direct: true },
				{ position: [50, 60] },
			],
		});

		const params = mockGetRoute.mock.calls[0]![0] as Record<
			string,
			unknown
		>;
		expect(params.lonlats).toBe('10,20|30,40,d|50,60');
		expect(params.straight).toBe('1');
	});

	// ── Profile ───────────────────────────────────────────────────

	it('strips .brf extension from profile name', async () => {
		mockGetRoute.mockResolvedValue('<gpx>...</gpx>');

		await getRoute({
			waypoints: [
				{ position: [10, 20] },
				{ position: [30, 40] },
			],
			profile: 'trekking.brf',
		});

		const params = mockGetRoute.mock.calls[0]![0] as Record<
			string,
			unknown
		>;
		expect(params.profile).toBe('trekking');
	});

	it('keeps profile name without .brf unchanged', async () => {
		mockGetRoute.mockResolvedValue('<gpx>...</gpx>');

		await getRoute({
			waypoints: [
				{ position: [10, 20] },
				{ position: [30, 40] },
			],
			profile: 'trekking',
		});

		const params = mockGetRoute.mock.calls[0]![0] as Record<
			string,
			unknown
		>;
		expect(params.profile).toBe('trekking');
	});

	// ── Vehicle / speed ───────────────────────────────────────────

	it('maps vehicle to v key', async () => {
		mockGetRoute.mockResolvedValue('<gpx>...</gpx>');

		await getRoute({
			waypoints: [
				{ position: [10, 20] },
				{ position: [30, 40] },
			],
			vehicle: 'bicycle',
		});

		const params = mockGetRoute.mock.calls[0]![0] as Record<
			string,
			unknown
		>;
		expect(params.v).toBe('bicycle');
	});

	it('maps fast boolean to 0/1 int', async () => {
		mockGetRoute.mockResolvedValue('<gpx>...</gpx>');

		await getRoute({
			waypoints: [
				{ position: [10, 20] },
				{ position: [30, 40] },
			],
			fast: true,
		});

		const params = mockGetRoute.mock.calls[0]![0] as Record<
			string,
			unknown
		>;
		expect(params.fast).toBe(1);
	});

	it('omits fast when false', async () => {
		mockGetRoute.mockResolvedValue('<gpx>...</gpx>');

		await getRoute({
			waypoints: [
				{ position: [10, 20] },
				{ position: [30, 40] },
			],
			fast: false,
		});

		const params = mockGetRoute.mock.calls[0]![0] as Record<
			string,
			unknown
		>;
		expect(params.fast).toBe(0);
	});

	// ── Format ────────────────────────────────────────────────────

	it('maps format to trackFormat key', async () => {
		mockGetRoute.mockResolvedValue('{"features":[]}');

		await getRoute({
			waypoints: [
				{ position: [10, 20] },
				{ position: [30, 40] },
			],
			format: 'json',
		});

		const params = mockGetRoute.mock.calls[0]![0] as Record<
			string,
			unknown
		>;
		expect(params.trackFormat).toBe('json');
	});

	// ── Alternative index ─────────────────────────────────────────

	it('maps alternativeIndex to alternativeidx', async () => {
		mockGetRoute.mockResolvedValue('<gpx>...</gpx>');

		await getRoute({
			waypoints: [
				{ position: [10, 20] },
				{ position: [30, 40] },
			],
			alternativeIndex: 2,
		});

		const params = mockGetRoute.mock.calls[0]![0] as Record<
			string,
			unknown
		>;
		expect(params.alternativeidx).toBe(2);
	});

	// ── Turn instruction mode mapping ─────────────────────────────

	it('maps turnInstructionMode enum to timode int', async () => {
		mockGetRoute.mockResolvedValue('<gpx>...</gpx>');

		const modes: Array<{
			name: string;
			expected: number;
		}> = [
			{ name: 'none', expected: 0 },
			{ name: 'auto-choose', expected: 1 },
			{ name: 'locus', expected: 2 },
			{ name: 'osmand', expected: 3 },
			{ name: 'comment', expected: 4 },
			{ name: 'gpsies', expected: 5 },
			{ name: 'orux', expected: 6 },
			{ name: 'locus-old', expected: 7 },
		];

		for (const { name, expected } of modes) {
			mockGetRoute.mockClear();
			await getRoute({
				waypoints: [
					{ position: [10, 20] },
					{ position: [30, 40] },
				],
				turnInstructionMode: name as Parameters<
					typeof getRoute
				>[0]['turnInstructionMode'],
			});

			const params = mockGetRoute.mock.calls[0]![0] as Record<
				string,
				unknown
			>;
			expect(params.timode).toBe(expected);
		}
	});

	// ── Elevation ─────────────────────────────────────────────────

	it('sets engineMode to 2 when elevation is true', async () => {
		mockGetRoute.mockResolvedValue('<gpx>...</gpx>');

		await getRoute({
			waypoints: [
				{ position: [10, 20] },
				{ position: [30, 40] },
			],
			elevation: true,
		});

		const params = mockGetRoute.mock.calls[0]![0] as Record<
			string,
			unknown
		>;
		expect(params.engineMode).toBe(2);
	});

	it('omits engineMode when elevation is false', async () => {
		mockGetRoute.mockResolvedValue('<gpx>...</gpx>');

		await getRoute({
			waypoints: [
				{ position: [10, 20] },
				{ position: [30, 40] },
			],
			elevation: false,
		});

		const params = mockGetRoute.mock.calls[0]![0] as Record<
			string,
			unknown
		>;
		expect(params.engineMode).toBeUndefined();
	});

	// ── Export waypoints ──────────────────────────────────────────

	it('sets exportWaypoints to 1 when true', async () => {
		mockGetRoute.mockResolvedValue('<gpx>...</gpx>');

		await getRoute({
			waypoints: [
				{ position: [10, 20] },
				{ position: [30, 40] },
			],
			exportWaypoints: true,
		});

		const params = mockGetRoute.mock.calls[0]![0] as Record<
			string,
			unknown
		>;
		expect(params.exportWaypoints).toBe(1);
	});

	// ── Nogo areas ────────────────────────────────────────────────

	it('serializes nogo areas into pipe-delimited string', async () => {
		mockGetRoute.mockResolvedValue('<gpx>...</gpx>');

		await getRoute({
			waypoints: [
				{ position: [10, 20] },
				{ position: [30, 40] },
			],
			nogos: [
				{ position: [15, 25], radiusMeters: 500 },
				{ position: [35, 45], radiusMeters: 1000, weight: 2 },
			],
		});

		const params = mockGetRoute.mock.calls[0]![0] as Record<
			string,
			unknown
		>;
		expect(params.nogos).toBe('15,25,500|35,45,1000,2');
		expect(params.nogoLats).toEqual([25, 45]);
		expect(params.nogoLons).toEqual([15, 35]);
		expect(params.nogoRadi).toEqual([500, 1000]);
	});

	// ── Polylines / polygons ──────────────────────────────────────

	it('serializes polylines into pipe-delimited string', async () => {
		mockGetRoute.mockResolvedValue('<gpx>...</gpx>');

		await getRoute({
			waypoints: [
				{ position: [10, 20] },
				{ position: [30, 40] },
			],
			polylines: [
				{
					positions: [
						[15, 25],
						[16, 26],
					],
				},
				{
					positions: [
						[35, 45],
						[36, 46],
					],
					weight: 3,
				},
			],
		});

		const params = mockGetRoute.mock.calls[0]![0] as Record<
			string,
			unknown
		>;
		expect(params.polylines).toBe('15,25,16,26|35,45,36,46,3');
	});

	it('serializes polygons same format as polylines', async () => {
		mockGetRoute.mockResolvedValue('<gpx>...</gpx>');

		await getRoute({
			waypoints: [
				{ position: [10, 20] },
				{ position: [30, 40] },
			],
			polygons: [
				{
					positions: [
						[10, 20],
						[11, 20],
						[11, 21],
						[10, 20],
					],
				},
			],
		});

		const params = mockGetRoute.mock.calls[0]![0] as Record<
			string,
			unknown
		>;
		expect(params.polygons).toBe('10,20,11,20,11,21,10,20');
	});

	// ── POIs ──────────────────────────────────────────────────────

	it('serializes pois into pipe-delimited string', async () => {
		mockGetRoute.mockResolvedValue('<gpx>...</gpx>');

		await getRoute({
			waypoints: [
				{ position: [10, 20] },
				{ position: [30, 40] },
			],
			pois: [
				{ position: [15, 25], name: 'Cafe' },
				{ position: [35, 45], name: 'Viewpoint' },
			],
		});

		const params = mockGetRoute.mock.calls[0]![0] as Record<
			string,
			unknown
		>;
		expect(params.pois).toBe('15,25,Cafe|35,45,Viewpoint');
	});

	// ── Heading / direction ───────────────────────────────────────

	it('passes heading and direction as doubles', async () => {
		mockGetRoute.mockResolvedValue('<gpx>...</gpx>');

		await getRoute({
			waypoints: [
				{ position: [10, 20] },
				{ position: [30, 40] },
			],
			heading: 90,
			direction: 180,
		});

		const params = mockGetRoute.mock.calls[0]![0] as Record<
			string,
			unknown
		>;
		expect(params.heading).toBe(90);
		expect(params.direction).toBe(180);
	});

	// ── Compression ───────────────────────────────────────────────

	it('passes acceptCompressedResult to native layer', async () => {
		mockGetRoute.mockResolvedValue('<gpx>...</gpx>');

		await getRoute({
			waypoints: [
				{ position: [10, 20] },
				{ position: [30, 40] },
			],
			acceptCompressedResult: true,
		});

		const params = mockGetRoute.mock.calls[0]![0] as Record<
			string,
			unknown
		>;
		expect(params.acceptCompressedResult).toBe(true);
	});

	// ── Extra params ──────────────────────────────────────────────

	it('passes extraParams through', async () => {
		mockGetRoute.mockResolvedValue('<gpx>...</gpx>');

		await getRoute({
			waypoints: [
				{ position: [10, 20] },
				{ position: [30, 40] },
			],
			extraParams: { uphillcost: '10', downhillcost: '5' },
		});

		const params = mockGetRoute.mock.calls[0]![0] as Record<
			string,
			unknown
		>;
		expect(params.extraParams).toEqual({
			uphillcost: '10',
			downhillcost: '5',
		});
	});

	// ── Error normalization ───────────────────────────────────────

	it('normalizes native errors into BRouterError shape', async () => {
		const nativeError: Record<string, unknown> = {
			message: 'BRouter service is not available',
		};
		nativeError.code = 'SERVICE_UNAVAILABLE';
		mockGetRoute.mockRejectedValue(nativeError);

		await expect(
			getRoute({
				waypoints: [
					{ position: [10, 20] },
					{ position: [30, 40] },
				],
			})
		).rejects.toEqual({
			code: 'SERVICE_UNAVAILABLE',
			message: 'BRouter service is not available',
		});
	});

	// ── Returns RouteResult ───────────────────────────────────────

	it('returns RouteResult with raw string and format', async () => {
		mockGetRoute.mockResolvedValue('<gpx>...</gpx>');

		const result = await getRoute({
			waypoints: [
				{ position: [10, 20] },
				{ position: [30, 40] },
			],
		});

		expect(result).toEqual({
			raw: '<gpx>...</gpx>',
			format: 'gpx',
		});
	});
});
