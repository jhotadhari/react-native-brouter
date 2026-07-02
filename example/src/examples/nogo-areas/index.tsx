import { useState, useCallback, type FC } from 'react';
import {
	Pressable,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	View,
} from 'react-native';
import { getRoute, type NogoArea, type Waypoint } from 'react-native-brouter';
import {
	ControlPanel,
	ControlRow,
	ControlSection,
	StatusLine,
} from '../../components/ControlPanel';
import { formatActionError, sharedStyles } from '../../sharedDeps';
import type { Example } from '../../types';

const WAYPOINTS: Waypoint[] = [
	{ position: [-71.98, -13.53] },
	{ position: [-71.88, -13.52] },
	{ position: [-71.85, -13.43] },
	{ position: [-71.94, -13.4] },
];

const NOGO_DEFS: { label: string; nogo: NogoArea }[] = [
	{
		label: 'Zone A (500m)',
		nogo: {
			position: [-71.9, -13.49],
			radiusMeters: 500,
		},
	},
	{
		label: 'Zone B (400m)',
		nogo: {
			position: [-71.91, -13.44],
			radiusMeters: 400,
		},
	},
	{
		label: 'Zone C (600m)',
		nogo: {
			position: [-71.86, -13.46],
			radiusMeters: 600,
		},
	},
];

const NogoAreasExample: FC<{ height: number; width: number }> = ({
	height,
	width,
}) => {
	const [enabled, setEnabled] = useState<boolean[]>(
		NOGO_DEFS.map(() => false)
	);
	const [result, setResult] = useState<string>('');
	const [busy, setBusy] = useState(false);
	const [status, setStatus] = useState('idle');

	const toggleNogo = useCallback((index: number) => {
		setEnabled((prev) => {
			const next = [...prev];
			next[index] = !next[index];
			return next;
		});
		setResult('');
		setStatus('ready');
	}, []);

	const runRoute = useCallback(() => {
		const activeNogos: NogoArea[] = NOGO_DEFS.filter(
			(_, i) => enabled[i]
		).map((d) => d.nogo);

		setBusy(true);
		setStatus('routing...');
		setResult('');

		getRoute({
			waypoints: WAYPOINTS,
			format: 'gpx',
			nogos: activeNogos.length > 0 ? activeNogos : undefined,
		})
			.then((route) => {
				setResult(route.raw);
				setStatus(`done (${activeNogos.length} nogo(s) active)`);
			})
			.catch((e: unknown) => {
				setResult(formatActionError(e));
				setStatus('error');
			})
			.finally(() => setBusy(false));
	}, [enabled]);

	const nogoSummary = NOGO_DEFS.map((d) => {
		const [lng, lat] = d.nogo.position;
		return `${d.label}: ${lng},${lat} r=${d.nogo.radiusMeters}m`;
	}).join('\n');

	return (
		<View style={[styles.container, { height, width }]}>
			<ControlPanel width={width}>
				<ControlSection title="Waypoints">
					{WAYPOINTS.map((wp, i) => (
						<ControlRow key={i}>
							<Text style={sharedStyles.text}>
								{`WP${i + 1}: ${wp.position[0]}, ${wp.position[1]}`}
							</Text>
						</ControlRow>
					))}
				</ControlSection>

				<ControlSection title="Nogo Areas">
					{NOGO_DEFS.map((d, i) => (
						<ControlRow key={i}>
							<Switch
								value={enabled[i]}
								onValueChange={() => toggleNogo(i)}
							/>
							<Text style={sharedStyles.text}>{d.label}</Text>
						</ControlRow>
					))}
				</ControlSection>

				<ControlSection title="Action">
					<ControlRow>
						<Pressable
							style={styles.button}
							onPress={runRoute}
							disabled={busy}
						>
							<Text style={styles.buttonText}>
								{busy ? 'Routing...' : 'Get Route'}
							</Text>
						</Pressable>
					</ControlRow>
					<StatusLine
						label="Status"
						value={status}
						busy={busy}
						busyValue="working..."
					/>
				</ControlSection>

				<ControlSection title="Nogo Definitions">
					<ControlRow>
						<Text style={sharedStyles.text}>{nogoSummary}</Text>
					</ControlRow>
				</ControlSection>
			</ControlPanel>

			{result !== '' && (
				<ScrollView style={styles.output}>
					<Text style={styles.outputText}>{result}</Text>
				</ScrollView>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#1a1a2e',
	},
	button: {
		backgroundColor: '#2196F3',
		paddingVertical: 10,
		paddingHorizontal: 24,
		borderRadius: 8,
	},
	buttonText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 16,
	},
	output: {
		flex: 1,
		padding: 12,
	},
	outputText: {
		color: '#0f0',
		fontSize: 11,
		fontFamily: 'monospace',
	},
});

const ExampleComponent: FC<{ height: number; width: number }> = (props) => (
	<NogoAreasExample {...props} />
);

const example: Example = {
	key: 'nogo-areas',
	label: 'Nogo Areas',
	category: 'advanced',
	ExampleComponent,
};

export default example;
