import { useState } from 'react';
import { Text, View, Button, ScrollView } from 'react-native';
import { getTrackFromParams } from 'react-native-brouter';

const lonlats = [
	'-71.047736,-13.950089',
	'-70.902377,-13.791436',
	'-70.97545,-13.591525',
].join( '|' );

export default function App() {

	const [result,setResult] = useState( '' );
	const [loading,setLoading] = useState( false );

	return (
		<View style={ {
			flex: 1,
			alignItems: 'center'
		} }>

			<View style={ {
				height: 150,
				padding: 20,
			} }>

				<Text style={ { marginBottom: 10 } } >lonlats: { lonlats }</Text>

				<Button
					title={ 'get' }
					onPress={ () => {
						setLoading( true );
						getTrackFromParams( {
							lonlats,
							trackFormat: 'json',
							fast: false,
							v: 'bicycle',
						} ).then( ( newResult: string ) => {
							setResult( newResult );
						} ).catch( ( e: any ) => {
							setResult( e?.userInfo?.errorMsg );
						} ).finally( () => setLoading( false ) );
					} }
				/>

				{ loading && <Text style={ { marginTop: 10 } }>{ 'loading' }</Text> }

			</View>

			{ result && <ScrollView style={ { paddingHorizontal: 20} }>
				<Text>{ result }</Text>
			</ScrollView> }

		</View>
	);
};