import BRouter, { type GetTrackParams } from './NativeBRouter';

export * from './NativeBRouter';

export function getTrackFromParams(params: GetTrackParams): Promise<string> {
	return BRouter.getTrackFromParams(params);
}
