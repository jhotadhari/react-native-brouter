import { useCallback, useMemo, useState, type FC } from 'react';
import { Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getRoute, type Waypoint } from 'react-native-brouter';
import {
	ControlPanel,
	ControlSection,
	StatusLine,
} from '../../components/ControlPanel';
import { sharedStyles } from '../../sharedDeps';
import type { Example } from '../../types';

const waypoints: Waypoint[] = [
	{ position: [-71.047736, -13.950089], name: 'Start' },
	{ position: [-70.97545, -13.591525], name: 'End' },
];

interface RouteSummary {
	distance: string;
	duration: string;
}

function parseJsonSummary(raw: string): RouteSummary | null {
	try {
		const fc = JSON.parse(raw);
		if (
			!fc ||
			fc.type !== 'FeatureCollection' ||
			!Array.isArray(fc.features)
		) {
			return null;
		}
		const props = fc.features[0]?.properties;
		if (!props) {
			return null;
		}

		const trackLength = Number(props['track-length']);
		const totalTime = Number(props['total-time']);

		const distanceStr = Number.isFinite(trackLength)
			? `${(trackLength / 1000).toFixed(2)} km`
			: 'n/a';

		const durationStr = Number.isFinite(totalTime)
			? `${Math.round(totalTime / 60)} min`
			: 'n/a';

		return { distance: distanceStr, duration: durationStr };
	} catch {
		return null;
	}
}

const BasicExample: FC<{ height: number; width: number }> = ({
	height,
	width,
}) => {
	const [raw, setRaw] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const summary = useMemo<RouteSummary | null>(
		() => (raw ? parseJsonSummary(raw) : null),
		[raw]
	);

	const onGetRoute = useCallback(() => {
		setLoading(true);
		setError('');
		getRoute({
			waypoints,
			vehicle: 'bicycle',
			format: 'json',
		})
			.then((route) => {
				setRaw(route.raw);
			})
			.catch((e: unknown) => {
				const err = e as Record<string, unknown> | undefined;
				setError((err?.message as string) ?? 'Unknown error');
				setRaw('');
			})
			.finally(() => setLoading(false));
	}, []);

	return (
		<View style={[styles.root, { width, height }]}>
			<ControlPanel width={width}>
				<ControlSection title={'Waypoints'}>
					{waypoints.map((wp, i) => (
						<Text
							key={i}
							style={sharedStyles.text}
						>
							{wp.name ?? `WP${i + 1}`}
							{': '}
							{wp.position[0]!.toFixed(4)}
							{', '}
							{wp.position[1]!.toFixed(4)}
						</Text>
					))}
				</ControlSection>

				<ControlSection>
					<Button
						title={loading ? 'Routing...' : 'Get Route'}
						onPress={onGetRoute}
						disabled={loading}
					/>
				</ControlSection>

				{error ? (
					<ControlSection title={'Error'}>
						<Text style={sharedStyles.text}>{error}</Text>
					</ControlSection>
				) : null}

				{summary ? (
					<ControlSection title={'Result'}>
						<StatusLine
							label={'Distance'}
							value={summary.distance}
						/>
						<StatusLine
							label={'Duration'}
							value={summary.duration}
						/>
					</ControlSection>
				) : null}
			</ControlPanel>

			{raw ? (
				<ScrollView style={styles.output}>
					<Text style={styles.outputText}>{raw}</Text>
				</ScrollView>
			) : null}
		</View>
	);
};

export { BasicExample as ExampleComponent };
export default {
	key: 'basic',
	label: 'Basic Routing',
	category: 'basic',
	ExampleComponent: BasicExample,
} as Example;

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: '#fff',
	},
	output: {
		flex: 1,
		paddingHorizontal: 12,
	},
	outputText: {
		fontSize: 12,
		color: '#333',
		fontFamily: 'monospace',
	},
});
