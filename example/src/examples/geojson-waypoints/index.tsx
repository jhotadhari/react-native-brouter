import { useCallback, useState, type FC } from 'react';
import { Button, Pressable, ScrollView, Text, View } from 'react-native';

import {
	getRoute,
	type GeoJSONRouteResult,
	type Position,
} from 'react-native-brouter/geojson';

import { formatActionError, sharedStyles } from '../../sharedDeps';
import {
	ControlPanel,
	ControlSection,
	ControlRow,
	StatusLine,
} from '../../components/ControlPanel';
import type { Example } from '../../types';

// ── Waypoints (Cusco, Peru area — same region as other examples) ──────

const waypoints: Position[] = [
	[-71.047736, -13.950089],
	[-70.902377, -13.791436],
	[-70.97545, -13.591525],
];

// ── Component ─────────────────────────────────────────────────────────

const GeoJSONWaypointsExample: FC<{ height: number; width: number }> = ({
	width,
}) => {
	const [profile, setProfile] = useState<'bicycle' | 'foot'>('bicycle');
	const [result, setResult] = useState<GeoJSONRouteResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const doRoute = useCallback(async () => {
		setLoading(true);
		setError(null);
		setResult(null);

		try {
			const route = await getRoute({
				waypoints,
				vehicle: profile,
				format: 'json',
			});
			setResult(route);
		} catch (e: unknown) {
			setError(formatActionError(e));
		} finally {
			setLoading(false);
		}
	}, [profile]);

	const summary = result?.parsed?.summary;

	return (
		<View style={{ flex: 1 }}>
			{/* Result display */}
			<ScrollView
				style={{ flex: 1, padding: 12 }}
				contentContainerStyle={{ gap: 12 }}
			>
				<Text style={sharedStyles.text}>
					{'Waypoints (Position[]):'}
				</Text>
				{waypoints.map((pos, i) => (
					<Text
						key={i}
						style={sharedStyles.text}
					>
						{`  [${i}]  lng: ${pos[0]}, lat: ${pos[1]}`}
					</Text>
				))}

				{summary && (
					<>
						<Text style={sharedStyles.text}>
							{'Route summary:'}
						</Text>
						<Text style={sharedStyles.text}>
							{`  Distance:  ${
								summary.totalDistanceMeters != null
									? `${(summary.totalDistanceMeters / 1000).toFixed(2)} km`
									: 'n/a'
							}`}
						</Text>
						<Text style={sharedStyles.text}>
							{`  Duration:  ${
								summary.totalDurationSeconds != null
									? `${Math.round(summary.totalDurationSeconds / 60)} min`
									: 'n/a'
							}`}
						</Text>
						<Text style={sharedStyles.text}>
							{`  Ascent:    ${
								summary.ascentMeters != null
									? `${Math.round(summary.ascentMeters)} m`
									: 'n/a'
							}`}
						</Text>
						<Text style={sharedStyles.text}>
							{`  Descent:   ${
								summary.descentMeters != null
									? `${Math.round(summary.descentMeters)} m`
									: 'n/a'
							}`}
						</Text>
						<Text style={sharedStyles.text}>
							{`  Points:    ${summary.trackPointCount ?? 'n/a'}`}
						</Text>
					</>
				)}

				{result?.parsed && (
					<Text style={sharedStyles.text}>
						{`Track features: ${result.parsed.track.features.length}`}
					</Text>
				)}

				{error && (
					<Text style={sharedStyles.text}>{`Error: ${error}`}</Text>
				)}
			</ScrollView>

			{/* Controls */}
			<ControlPanel width={width}>
				<ControlSection title="Profile">
					<ControlRow>
						<Pressable onPress={() => setProfile('bicycle')}>
							<Text
								style={[
									sharedStyles.text,
									{
										fontWeight:
											profile === 'bicycle'
												? 'bold'
												: 'normal',
									},
								]}
							>
								{'bicycle'}
							</Text>
						</Pressable>
						<Pressable onPress={() => setProfile('foot')}>
							<Text
								style={[
									sharedStyles.text,
									{
										fontWeight:
											profile === 'foot'
												? 'bold'
												: 'normal',
									},
								]}
							>
								{'foot'}
							</Text>
						</Pressable>
					</ControlRow>
				</ControlSection>

				<ControlSection>
					<Button
						title={loading ? 'Routing...' : 'Get Route'}
						onPress={doRoute}
						disabled={loading}
					/>
				</ControlSection>

				{error && (
					<StatusLine
						label="Error"
						value={error}
					/>
				)}
				{summary && (
					<StatusLine
						label="Distance"
						value={
							summary.totalDistanceMeters != null
								? `${(summary.totalDistanceMeters / 1000).toFixed(2)} km`
								: 'n/a'
						}
					/>
				)}
			</ControlPanel>
		</View>
	);
};

// ── Export ────────────────────────────────────────────────────────────

export default {
	key: 'geojson-waypoints',
	label: 'GeoJSON Waypoints',
	category: 'geojson',
	ExampleComponent: GeoJSONWaypointsExample,
} as Example;
