import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { hasNotch } from 'react-native-device-info';

const useSafeAreaPadding = () => {
	const { width: windowWidth, height: windowHeight } = useWindowDimensions();
	const isLandscape = windowWidth > windowHeight;
	return useMemo(() => {
		return isLandscape ? {
			paddingRight: hasNotch() ? 60 : 0,
			paddingLeft: hasNotch() ? 60 : 0,
			paddingTop: 15,
			paddingBottom: 15,
		} : {
			paddingTop: hasNotch() ? 65 : 15,
			paddingBottom: hasNotch() ? 35 : 15,
			paddingLeft: 0,
			paddingRight: 0,
		};
	}, [isLandscape]);
};

export default useSafeAreaPadding;
