import * as React from 'react';
import Plugin from '@joplin/lib/services/plugins/Plugin';
import ExtendedWebView, { WebViewControl } from '../../components/ExtendedWebView';
import shim from '@joplin/lib/shim';
import PluginRunner from './PluginRunner';
import { useCallback, useRef } from 'react';
import { WebViewMessageEvent } from 'react-native-webview';

interface Props {
	plugin: Plugin;
	pluginRunner: PluginRunner;
}

const html = `
	<!DOCTYPE html>
	<html>
		<head>
			<meta charset="utf-8"/>
		</head>
		<body style="background: red;">
		</body>
	</html>
`;

const injectedJs = `
	if (!window.loadedBackgroundPage) {
		${shim.injectedJs('pluginBackgroundPage')}
		window.pluginBackgroundPage = pluginBackgroundPage;
		console.log('Loaded PluginRunnerWebView.');

		// Necessary, because React Native WebView can re-run injectedJs
		// without reloading the page.
		window.loadedBackgroundPage = true;
	}
`;

const PluginRunnerWebView: React.FC<Props> = props => {
	const webviewRef = useRef<WebViewControl>();
	const onLoadStart = useCallback(() => {
		console.log('%%loadstart', props.plugin.id);
		props.pluginRunner.registerWebView(props.plugin, webviewRef);
	}, [props.pluginRunner, props.plugin]);

	const onWebviewMessage = useCallback((event: WebViewMessageEvent) => {
		props.pluginRunner.onWebviewMessage(props.plugin, event);
	}, [props.pluginRunner, props.plugin]);

	if (!props.plugin.baseDir) {
		throw new Error(`Unable to load plugin ${props.plugin.id} -- missing baseDir.`);
	}

	return (
		<ExtendedWebView
			webviewInstanceId={'plugin'}
			baseDirectory={props.plugin.baseDir}
			html={html}
			injectedJavaScript={injectedJs}
			hasPluginScripts={true}
			onMessage={onWebviewMessage}
			onLoadEnd={onLoadStart}
			ref={webviewRef}
		/>
	);
};

export default PluginRunnerWebView;