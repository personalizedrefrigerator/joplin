import * as React from 'react';
import { View, Platform } from 'react-native';
import { SafeAreaViewProps, SafeAreaView } from 'react-native-safe-area-context';

function JoplinSafeAreaView(props: SafeAreaViewProps) {
	if (Platform.OS !== 'web') {
		return <SafeAreaView {...props}>{props.children}</SafeAreaView>;
	} else {
		return <View {...props}>{props.children}</View>;
	}
}

export default JoplinSafeAreaView;
