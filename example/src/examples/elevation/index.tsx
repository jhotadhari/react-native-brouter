import { useState, type FC } from 'react';
import {
	Button,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	View,
} from 'react-native';
import { getRoute, type Waypoint } from 'react-native-brouter';
import { formatActionError, sharedStyles } from '../../sharedDeps';
import {
	ControlPanel,
	ControlRow,
	ControlSection,
	StatusLine,
} from '../../components/ControlPanel';
import type { Example } from '../../types';

// Two waypoints in the Bernese Alps with significant elevation change:
// Interlaken (~568 m) up to Grindelwald (~1 034 m) via the road through
// Zweilütschinen — a ~10 km climb with ~500 m of verified altitude gain.
const ELEVATION_WAYPOINTS: Waypoint[] = [
	{ position: [7.854, 46.686], name: 'Interlaken' },
	{ position: [8.047, 46.624], name: 'Grindelwald' },
];

interface ElevationStats {
	totalAscent: number;
	totalDescent: number;
}

/**
 * Extract elevation stats from a BRouter JSON track result.
 *
 * BRouter reports total ascent / descent inside "messages" when
 * engineMode = 2.  The JSON schema varies between versions — try
 * the top-level `messages` array first, then fall back to scanning
 * `features[].properties.messages`.
 */
function parseElevationStats(raw: string): ElevationStats | null {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return null;
	}

	if (!parsed || typeof parsed !== 'object') {
		return null;
	}

	const obj = parsed as Record<string, unknown>;

	// Collect message strings from either location.
	const messages: string[] = [];

	const topLevel = obj.messages;
	if (Array.isArray(topLevel)) {
		for (const m of topLevel) {
			if (m && typeof m === 'object') {
				const msg = (m as Record<string, unknown>).msg;
				if (typeof msg === 'string') {
					messages.push(msg);
				}
			}
		}
	}

	const features = obj.features;
	if (Array.isArray(features)) {
		for (const f of features) {
			if (!f || typeof f !== 'object') continue;
			const props = (f as Record<string, unknown>).properties;
			if (!props || typeof props !== 'object') continue;
			const featureMessages = (props as Record<string, unknown>).messages;
			if (Array.isArray(featureMessages)) {
				for (const m of featureMessages) {
					if (m && typeof m === 'object') {
						const msg = (m as Record<string, unknown>).msg;
						if (typeof msg === 'string') {
							messages.push(msg);
						}
					}
				}
			}
		}
	}

	if (messages.length === 0) {
		return null;
	}

	let totalAscent = 0;
	let totalDescent = 0;

	for (const msg of messages) {
		const ascentMatch = msg.match(/totalAscent\s*=\s*(-?[\d.]+)/);
		if (ascentMatch && ascentMatch[1]) {
			totalAscent = parseFloat(ascentMatch[1]);
		}
		const descentMatch = msg.match(/totalDescent\s*=\s*(-?[\d.]+)/);
		if (descentMatch && descentMatch[1]) {
			totalDescent = parseFloat(descentMatch[1]);
		}
	}

	if (totalAscent === 0 && totalDescent === 0) {
		return null;
	}

	return { totalAscent, totalDescent };
}

const ElevationExample: FC<{ height: number; width: number }> = ({
	height,
	width,
}) => {
	const [elevationEnabled, setElevationEnabled] = useState(false);
	const [result, setResult] = useState<string>('');
	const [error, setError] = useState<string>('');
	const [busy, setBusy] = useState(false);
	const [elevationStats, setElevationStats] = useState<ElevationStats | null>(
		null
	);

	const handleGetRoute = async () => {
		setBusy(true);
		setError('');
		setResult('');
		setElevationStats(null);

		try {
			const route = await getRoute({
				waypoints: ELEVATION_WAYPOINTS,
				format: 'json',
				vehicle: 'bicycle',
				fast: false,
				elevation: elevationEnabled,
			});

			setResult(route.raw);

			if (elevationEnabled) {
				const stats = parseElevationStats(route.raw);
				if (stats) {
					setElevationStats(stats);
				}
			}
		} catch (e: unknown) {
			setError(formatActionError(e));
		} finally {
			setBusy(false);
		}
	};

	return (
		<View
			style={[
				styles.container,
				{ height, width },
			]}
		>
			<ControlPanel width={width}>
				<ControlSection title="Elevation">
					<ControlRow>
						<Text style={sharedStyles.text}>
							{'Request elevation'}
						</Text>
						<Switch
							value={elevationEnabled}
							onValueChange={setElevationEnabled}
						/>
					</ControlRow>

					<Button
						title={
							busy
								? 'Routing...'
								: elevationEnabled
									? 'Get route + elevation'
									: 'Get route'
						}
						onPress={handleGetRoute}
						disabled={busy}
					/>
				</ControlSection>

				{elevationStats && (
					<ControlSection title="Elevation Data">
						<StatusLine
							label="Ascent"
							value={`${Math.round(elevationStats.totalAscent)} m`}
						/>
						<StatusLine
							label="Descent"
							value={`${Math.round(elevationStats.totalDescent)} m`}
						/>
					</ControlSection>
				)}

				<ControlSection title="Status">
					<StatusLine
						label="Last action"
						value={error ? 'Error' : result ? 'OK' : 'idle'}
						busy={busy}
					/>
				</ControlSection>
			</ControlPanel>

			{(result || error) && (
				<ScrollView
					style={styles.output}
					contentContainerStyle={styles.outputContent}
				>
					{error ? (
						<Text style={styles.errorText}>{error}</Text>
					) : (
						<Text style={sharedStyles.text}>{result}</Text>
					)}
				</ScrollView>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#1a1a2e',
	},
	output: {
		flex: 1,
		marginTop: 54,
	},
	outputContent: {
		padding: 16,
	},
	errorText: {
		color: '#ff6b6b',
		fontSize: 14,
	},
});

const ExampleComponent: FC<{ height: number; width: number }> = (props) => (
	<ElevationExample {...props} />
);

const example: Example = {
	key: 'elevation',
	label: 'Elevation Data',
	category: 'advanced',
	ExampleComponent,
};

export default example;
