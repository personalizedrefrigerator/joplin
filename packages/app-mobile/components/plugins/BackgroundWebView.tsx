import * as React from 'react';

import { forwardRef, Ref, useCallback, useImperativeHandle, useMemo, useRef } from 'react';
import { WebViewErrorEvent } from 'react-native-webview/lib/WebViewTypes';

import Logger from '@joplin/utils/Logger';
import { OnMessageEvent, WebViewControl } from '../ExtendedWebView/types';
import { findNodeHandle, Platform, requireNativeComponent, UIManager } from 'react-native';
import Setting from '@joplin/lib/models/Setting';

interface Props {
	webviewInstanceId: string;
	html: string;
	injectedJavaScript: string;
	onMessage: (event: OnMessageEvent)=> void;
	onLoadStart: ()=> void;
	onLoadEnd: ()=> void;
}

const logger = Logger.create('PluginBackgroundWebView');


interface NativeProps {
	html: string;
	injectedJavaScript: string;
	onError(event: { nativeEvent: { description: string } }): void;
	onLoadStart: ()=> void;
	onLoadEnd: ()=> void;
	onMessage: (event: OnMessageEvent)=> void;
	allowFileAccessToDirectories: string[];
}
const NativeWebView = Platform.OS === 'android' ? (
	requireNativeComponent<NativeProps>('RCTPluginWebView')
) : null;

const BackgroundWebView = (props: Props, ref: Ref<WebViewControl>) => {
	const webviewRef = useRef(null);

	useImperativeHandle(ref, (): WebViewControl => {
		return {
			injectJS(js: string) {
				if (!webviewRef.current) {
					throw new Error(`BackgroundWebView(${props.webviewInstanceId}): Trying to call injectJavaScript on a WebView that isn't loaded.`);
				}

				const wrappedJs = `
				try {
					${js}
				}
				catch(e) {
					(window.logMessage || console.error)('Error in injected JS:' + e, e);
					throw e;
				};

				true;`;

				const viewId = findNodeHandle(webviewRef.current);
				UIManager.dispatchViewManagerCommand(
					viewId,
					'1', // COMMAND_INJECT_JS
					[wrappedJs],
				);
			},
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
			postMessage(message: any) {
				webviewRef.current.postMessage(JSON.stringify(message));
			},
		};
	}, [props.webviewInstanceId]);

	const onError = useCallback((event: WebViewErrorEvent) => {
		logger.error('Error', event.nativeEvent.description);
	}, []);

	const allowFileAccessToDirectories = useMemo(() => [
		Setting.value('pluginDataDir'),
	], []);

	return (
		<NativeWebView
			ref={webviewRef}
			html={props.html}
			onError={onError}
			onLoadEnd={props.onLoadEnd}
			onLoadStart={props.onLoadStart}
			onMessage={props.onMessage}
			injectedJavaScript={props.injectedJavaScript}
			allowFileAccessToDirectories={allowFileAccessToDirectories}
		/>
	);
};

export default forwardRef(BackgroundWebView);
