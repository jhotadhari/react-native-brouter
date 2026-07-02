export type ExampleCategory = 'basic' | 'geojson' | 'profiles' | 'advanced';

export interface Example {
	key: string;
	label: string;
	category: ExampleCategory;
	ExampleComponent: import('react').ElementType<{
		height: number;
		width: number;
	}>;
}
