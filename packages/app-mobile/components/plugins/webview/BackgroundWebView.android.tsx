import * as React from 'react';

import { forwardRef, Ref, useCallback, useImperativeHandle, useMemo, useRef } from 'react';
import { WebViewErrorEvent } from 'react-native-webview/lib/WebViewTypes';

import Logger from '@joplin/utils/Logger';
import { OnMessageEvent, WebViewControl } from '../../ExtendedWebView/types';
import { findNodeHandle, UIManager } from 'react-native';
import Setting from '@joplin/lib/models/Setting';
import RCTPluginWebView from './RCTPluginWebView';

interface Props {
	webviewInstanceId: string;
	html: string;
	injectedJavaScript: string;
	onMessage: (event: OnMessageEvent)=> void;
	onLoadStart: ()=> void;
	onLoadEnd: ()=> void;
}

const logger = Logger.create('PluginBackgroundWebView');


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
			postMessage(message: unknown) {
				this.injectJS(`
					window.dispatchEvent(
						new MessageEvent(
							'message', ${JSON.stringify({ data: message, origin: 'react-native' })}
						)
					)
				`);
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
		<RCTPluginWebView
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
