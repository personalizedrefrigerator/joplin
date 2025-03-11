import { Platform, requireNativeComponent } from 'react-native';

type OnMessageEvent = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Needs to interface with old code from before the rule was applied.
	nativeEvent: { data: any };
};

type OnErrorEvent = {
	nativeEvent: { description: string };
};

interface NativeProps {
	html: string;
	injectedJavaScript: string;
	onError(event: OnErrorEvent): void;
	onLoadStart: ()=> void;
	onLoadEnd: ()=> void;
	onMessage: (event: OnMessageEvent)=> void;
	allowFileAccessToDirectories: string[];
	debuggingEnabled: boolean;
}
const RCTPluginWebView = Platform.OS === 'android' ? (
	requireNativeComponent<NativeProps>('RCTPluginWebView')
) : null;

export default RCTPluginWebView;
