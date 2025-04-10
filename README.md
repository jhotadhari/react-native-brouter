# react-native-brouter

React native modules for android, to communicate with the brouter app service for offline navigation based on open data

## Installation

```sh
npm install react-native-brouter
```

Add this to your apps `AndroidManifest.xml`:
```xml
<queries>
    <package android:name="btools.routingapp" />
</queries>
```

## Usage


```js
import { getTrackFromParams } from 'react-native-brouter';

// ...

getTrackFromParams( {
    lonlats: [
        '-71.047736,-13.950089',
        '-70.902377,-13.791436',
        '-70.97545,-13.591525',
    ].join( '|' ),
    trackFormat: 'json',
    fast: false,
    v: 'bicycle',
} ).then( ( result: string ) => {
    console.log( result );
} ).catch( ( e: any ) => {
    console.log( e?.userInfo?.errorMsg );
} )
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

- Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
- The java code to connect to the BRouter service is copied from [OsmAnd](https://github.com/osmandapp/OsmAnd) app.
