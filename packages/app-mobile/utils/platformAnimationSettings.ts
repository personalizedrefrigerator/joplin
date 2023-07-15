import shim from '@joplin/lib/shim';
import { Animated, Platform } from 'react-native';


// See https://github.com/facebook/react-native/issues/37267#issuecomment-1585532375
const disbableNativeDriver =
	shim.mobilePlatform() === 'android' && (Platform.constants as any)?.Release === '12';

export const useNativeDriver = !disbableNativeDriver;

const platformAnimationSettings: Animated.AnimatedConfig = {
	useNativeDriver,
};
export default platformAnimationSettings;
