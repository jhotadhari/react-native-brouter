import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
	getRoute,
	type TurnInstructionMode,
	type Waypoint,
} from 'react-native-brouter';
import type { Example } from '../../types';

const TURN_INSTRUCTION_MODES: TurnInstructionMode[] = [
	'none',
	'auto-choose',
	'locus',
	'osmand',
	'comment',
	'gpsies',
	'orux',
	'locus-old',
];

const waypoints: Waypoint[] = [
	{ position: [-71.047736, -13.950089] },
	{ position: [-70.902377, -13.791436] },
	{ position: [-70.97545, -13.591525] },
];

function extractTurnInstructions(raw: string): string | null {
	try {
		const parsed = JSON.parse(raw);
		if (parsed && typeof parsed === 'object') {
			// BRouter JSON format: features array with turn instructions
			// in properties
			const features = parsed.features;
			if (Array.isArray(features) && features.length > 0) {
				const turns = features
					.filter(
						(f: any) => f?.properties?.name || f?.properties?.turn
					)
					.map((f: any, i: number) => {
						const name = f.properties.name ?? '';
						const turn = f.properties.turn ?? '';
						return `${i + 1}. ${turn ? turn + ' ' : ''}${name}`.trim();
					});
				if (turns.length > 0) {
					return turns.join('\n');
				}
			}
		}
		return null;
	} catch {
		return null;
	}
}

function TurnInstructionsExample({
	height,
	width,
}: {
	height: number;
	width: number;
}) {
	const [modeIndex, setModeIndex] = useState(0);
	const [result, setResult] = useState('');
	const [loading, setLoading] = useState(false);
	const [turns, setTurns] = useState<string | null>(null);

	const currentMode = TURN_INSTRUCTION_MODES[modeIndex]!;

	// Allocate roughly 40% of the height for turns and the rest for the raw
	// result, after subtracting room for controls and the fetch button.
	const contentHeight = Math.max(0, height - 220);
	const turnsHeight = turns ? Math.floor(contentHeight * 0.4) : 0;
	const resultHeight = Math.max(
		0,
		contentHeight - turnsHeight - (turns ? 12 : 0)
	);
	const scrollMaxWidth = Math.max(200, width - 32);

	const cycleMode = useCallback(() => {
		setModeIndex((prev) => (prev + 1) % TURN_INSTRUCTION_MODES.length);
	}, []);

	const fetchRoute = useCallback(() => {
		setLoading(true);
		setTurns(null);
		getRoute({
			waypoints,
			format: 'json',
			turnInstructionMode: currentMode,
			fast: false,
			vehicle: 'bicycle',
		})
			.then((route) => {
				setResult(route.raw);
				const instructions = extractTurnInstructions(route.raw);
				if (instructions) {
					setTurns(instructions);
				}
			})
			.catch((e: any) => {
				setResult(e?.message ?? String(e));
			})
			.finally(() => setLoading(false));
	}, [currentMode]);

	return (
		<View style={styles.container}>
			<View style={styles.controls}>
				<Text style={styles.label}>{'Turn Instruction Mode'}</Text>
				<Pressable
					style={styles.cycleButton}
					onPress={cycleMode}
				>
					<Text style={styles.cycleButtonText}>{currentMode}</Text>
				</Pressable>
				<Text style={styles.hint}>{'Tap to cycle mode'}</Text>
			</View>

			<Pressable
				style={[
					styles.fetchButton,
					loading && styles.fetchButtonDisabled,
				]}
				onPress={fetchRoute}
				disabled={loading}
			>
				<Text style={styles.fetchButtonText}>
					{loading ? 'Routing...' : 'Get Route'}
				</Text>
			</Pressable>

			{turns && (
				<View style={[styles.turnsContainer, { height: turnsHeight }]}>
					<Text style={styles.sectionTitle}>
						{'Turn-by-Turn Instructions'}
					</Text>
					<ScrollView
						style={[
							styles.turnsScroll,
							{ maxWidth: scrollMaxWidth },
						]}
						contentContainerStyle={styles.turnsContent}
					>
						<Text style={styles.turnsText}>{turns}</Text>
					</ScrollView>
				</View>
			)}

			{result && (
				<View
					style={[styles.resultContainer, { height: resultHeight }]}
				>
					<Text style={styles.sectionTitle}>{'Raw Result'}</Text>
					<ScrollView
						style={[
							styles.resultScroll,
							{ maxWidth: scrollMaxWidth },
						]}
						contentContainerStyle={styles.resultContent}
					>
						<Text style={styles.resultText}>{result}</Text>
					</ScrollView>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		backgroundColor: '#f5f5f5',
	},
	controls: {
		alignItems: 'center',
		marginBottom: 16,
	},
	label: {
		fontSize: 14,
		fontWeight: '600',
		color: '#333',
		marginBottom: 8,
	},
	cycleButton: {
		backgroundColor: '#1976d2',
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 8,
		minWidth: 160,
		alignItems: 'center',
	},
	cycleButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
	},
	hint: {
		fontSize: 12,
		color: '#888',
		marginTop: 6,
	},
	fetchButton: {
		backgroundColor: '#388e3c',
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 8,
		alignItems: 'center',
		marginBottom: 16,
	},
	fetchButtonDisabled: {
		opacity: 0.6,
	},
	fetchButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
	},
	turnsContainer: {
		marginBottom: 12,
	},
	resultContainer: {},
	sectionTitle: {
		fontSize: 14,
		fontWeight: '600',
		color: '#333',
		marginBottom: 6,
	},
	turnsScroll: {
		flex: 1,
		backgroundColor: '#e8f5e9',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#c8e6c9',
	},
	turnsContent: {
		padding: 12,
	},
	turnsText: {
		fontSize: 13,
		color: '#2e7d32',
		fontFamily: 'monospace',
	},
	resultScroll: {
		flex: 1,
		backgroundColor: '#fff',
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#ddd',
	},
	resultContent: {
		padding: 12,
	},
	resultText: {
		fontSize: 12,
		color: '#555',
		fontFamily: 'monospace',
	},
});

const example: Example = {
	key: 'turn-instructions',
	label: 'Turn Instructions',
	category: 'advanced',
	ExampleComponent: TurnInstructionsExample,
};

export default example;
