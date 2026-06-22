import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface GetTrackParams {
	connectTimeout?: number; // [ms] default: 1000   timeout to wait for connection for BRouter service.

	maxRunningTime?: number;
	trackFormat?: 'kml' | 'gpx' | 'json';
	//  "acceptCompressedResult"-->[true] sends a compressed result when output format is gpx
	//  "lats"-->double[] array of latitudes; 2 values at least.
	//  "lons"-->double[] array of longitudes; 2 values at least.
	//  "nogoLats"-->double[] array of nogo latitudes; may be null.
	//  "nogoLons"-->double[] array of nogo longitudes; may be null.
	//  "nogoRadi"-->double[] array of nogo radius in meters; may be null.
	fast?: boolean;
	v?: 'motorcar' | 'bicycle' | 'foot';
	//  "remoteProfile"--> (String), net-content of a profile. If remoteProfile != null, v+fast are ignored
	lonlats: string;
}

interface Spec extends TurboModule {
	getTrackFromParams(params: GetTrackParams): Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('BRouter');
