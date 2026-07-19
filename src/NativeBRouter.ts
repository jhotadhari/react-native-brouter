import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
	isAvailable(): Promise<boolean>;
	getRoute(params: { [key: string]: unknown }): Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('BRouter');
