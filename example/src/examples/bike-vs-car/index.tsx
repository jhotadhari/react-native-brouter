import { useState, type FC } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
	getRoute,
	type RouteResult,
	type Waypoint,
} from 'react-native-brouter';
import {
	ControlSection,
	ControlRow,
	StatusLine,
} from '../../components/ControlPanel';
import { formatActionError } from '../../sharedDeps';
import type { Example } from '../../types';

/**
 * Common waypoints for side-by-side profile comparison.
 */
const WAYPOINTS: Waypoint[] = [
	{ position: [-71.047736, -13.950089] },
	{ position: [-70.97545, -13.591525] },
	{ position: [-70.902377, -13.791436] },
];

/**
 * BRouter JSON result feature properties that carry distance / time.
 */
interface RouteProperties {
	'track-length'?: string;
	'total-time'?: string;
}

/**
 * Parsed numeric values extracted from a route result.
 */
interface ParsedRoute {
	distanceMeters: number;
	durationSeconds: number;
}

/**
 * Extract distance (meters) and duration (seconds) from the BRouter JSON
 * response. Returns null when the result can not be parsed.
 */
function parseRoute(result: RouteResult): ParsedRoute | null {
	try {
		const data = JSON.parse(result.raw);
		const props: RouteProperties | undefined =
			data?.features?.[0]?.properties;
		if (!props) {
			return null;
		}
		const trackLength = props['track-length'];
		const totalTime = props['total-time'];
		if (trackLength == null || totalTime == null) {
			return null;
		}
		return {
			distanceMeters: parseFloat(trackLength),
			durationSeconds: parseFloat(totalTime),
		};
	} catch {
		return null;
	}
}

/**
 * Format a distance in meters into a human-readable string.
 * Uses kilometres when >= 1000 m, otherwise metres.
 */
function formatDistance(meters: number): string {
	if (meters >= 1000) {
		return `${(meters / 1000).toFixed(1)} km`;
	}
	return `${Math.round(meters)} m`;
}

/**
 * Format a duration in seconds into a human-readable string (h m s).
 */
function formatDuration(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.round(seconds % 60);

	const parts: string[] = [];
	if (h > 0) {
		parts.push(`${h}h`);
	}
	if (m > 0 || h > 0) {
		parts.push(`${m}m`);
	}
	parts.push(`${s}s`);
	return parts.join(' ');
}

/**
 * Side-by-side routing comparison between bicycle and motorcar profiles.
 *
 * Press "Route by Bicycle" and "Route by Car" to fetch both routes, then
 * compare distance and travel time across the two vehicle modes.
 */
const BikeVsCar: FC<{ height: number; width: number }> = ({
	height,
	width,
}) => {
	const [, setBikeResult] = useState<RouteResult | null>(null);
	const [, setCarResult] = useState<RouteResult | null>(null);
	const [bikeParsed, setBikeParsed] = useState<ParsedRoute | null>(null);
	const [carParsed, setCarParsed] = useState<ParsedRoute | null>(null);
	const [bikeLoading, setBikeLoading] = useState(false);
	const [carLoading, setCarLoading] = useState(false);
	const [bikeError, setBikeError] = useState<string | null>(null);
	const [carError, setCarError] = useState<string | null>(null);

	const fetchRoute = (vehicle: 'bicycle' | 'motorcar') => {
		const isBike = vehicle === 'bicycle';

		if (isBike) {
			setBikeLoading(true);
			setBikeError(null);
			setBikeResult(null);
			setBikeParsed(null);
		} else {
			setCarLoading(true);
			setCarError(null);
			setCarResult(null);
			setCarParsed(null);
		}

		getRoute({
			waypoints: WAYPOINTS,
			format: 'json',
			vehicle,
			fast: false,
		})
			.then((route) => {
				const parsed = parseRoute(route);
				if (isBike) {
					setBikeResult(route);
					setBikeParsed(parsed);
				} else {
					setCarResult(route);
					setCarParsed(parsed);
				}
			})
			.catch((e: unknown) => {
				const msg = formatActionError(e);
				if (isBike) {
					setBikeError(msg);
				} else {
					setCarError(msg);
				}
			})
			.finally(() => {
				if (isBike) {
					setBikeLoading(false);
				} else {
					setCarLoading(false);
				}
			});
	};

	const hasBothParsed = bikeParsed != null && carParsed != null;

	const deltaDistance = hasBothParsed
		? carParsed.distanceMeters - bikeParsed.distanceMeters
		: 0;
	const deltaDuration = hasBothParsed
		? carParsed.durationSeconds - bikeParsed.durationSeconds
		: 0;

	return (
		<View style={[styles.container, { height, width }]}>
			<ScrollView contentContainerStyle={styles.scrollContent}>
				<ControlSection title="Route by Bicycle">
					<ControlRow>
						<Pressable
							style={styles.button}
							onPress={() => fetchRoute('bicycle')}
						>
							<Text style={styles.buttonText}>
								{'Route by Bicycle'}
							</Text>
						</Pressable>
					</ControlRow>
					<StatusLine
						label="Distance"
						value={
							bikeError != null
								? bikeError
								: bikeParsed != null
									? formatDistance(bikeParsed.distanceMeters)
									: '-'
						}
						busy={bikeLoading}
					/>
					<StatusLine
						label="Duration"
						value={
							bikeError != null
								? bikeError
								: bikeParsed != null
									? formatDuration(bikeParsed.durationSeconds)
									: '-'
						}
						busy={bikeLoading}
					/>
				</ControlSection>

				<ControlSection title="Route by Car">
					<ControlRow>
						<Pressable
							style={styles.button}
							onPress={() => fetchRoute('motorcar')}
						>
							<Text style={styles.buttonText}>
								{'Route by Car'}
							</Text>
						</Pressable>
					</ControlRow>
					<StatusLine
						label="Distance"
						value={
							carError != null
								? carError
								: carParsed != null
									? formatDistance(carParsed.distanceMeters)
									: '-'
						}
						busy={carLoading}
					/>
					<StatusLine
						label="Duration"
						value={
							carError != null
								? carError
								: carParsed != null
									? formatDuration(carParsed.durationSeconds)
									: '-'
						}
						busy={carLoading}
					/>
				</ControlSection>

				{hasBothParsed && (
					<ControlSection title="Comparison (Car - Bicycle)">
						<StatusLine
							label="Distance difference"
							value={
								deltaDistance >= 0
									? `+${formatDistance(deltaDistance)}`
									: formatDistance(deltaDistance)
							}
						/>
						<StatusLine
							label="Duration difference"
							value={
								deltaDuration >= 0
									? `+${formatDuration(deltaDuration)}`
									: formatDuration(deltaDuration)
							}
						/>
					</ControlSection>
				)}
			</ScrollView>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		top: 0,
		left: 0,
	},
	scrollContent: {
		padding: 16,
		gap: 24,
	},
	button: {
		backgroundColor: '#ffffff',
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 8,
	},
	buttonText: {
		color: '#000000',
		fontWeight: 'bold',
		fontSize: 16,
	},
});

const ExampleComponent = BikeVsCar;

const bikeVsCar: Example = {
	key: 'bike-vs-car',
	label: 'Bike vs Car Comparison',
	category: 'profiles',
	ExampleComponent,
};

export default bikeVsCar;
