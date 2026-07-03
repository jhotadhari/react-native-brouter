import { StyleSheet } from 'react-native';

/**
 * Format an error into a human-readable string for action-feedback UI
 * (toast, snackbar, inline status text, etc.).
 *
 * Handles:
 * - BRouterError objects with `code` and `message`
 * - Native promise rejections that pass `{ code, message }`
 * - Plain `Error` instances
 * - Primitives (strings, numbers, etc.)
 *
 * Pattern mirrors `sharedDeps.ts` from react-native-mapsforge-vtm.
 */
export function formatActionError(e: unknown): string {
	const err = e as Record<string, unknown> | undefined;

	if (err && typeof err === 'object') {
		const code: string | undefined =
			typeof err.code === 'string' ? err.code : undefined;
		const message: string | undefined =
			typeof err.message === 'string' ? err.message : undefined;

		if (code && message) {
			return `${code}: ${message}`;
		}
		if (message) {
			return message;
		}
	}

	if (e instanceof Error) {
		return e.message;
	}

	return String(e);
}

/**
 * Shared styles used by ControlPanel and other UI components.
 *
 * Pattern mirrors `sharedDeps.ts` from react-native-mapsforge-vtm.
 */
export const sharedStyles = StyleSheet.create({
	text: {
		color: '#fff',
	},
});

/**
 * Info-block and text-label styles reused across example screens.
 *
 * Pattern mirrors `sharedDeps.ts` from react-native-mapsforge-vtm.
 */
export const styles = StyleSheet.create({
	info: {
		padding: 12,
		marginVertical: 4,
		backgroundColor: '#e8f0fe',
		borderRadius: 6,
	},
	text: {
		fontSize: 14,
		color: '#333',
	},
});
