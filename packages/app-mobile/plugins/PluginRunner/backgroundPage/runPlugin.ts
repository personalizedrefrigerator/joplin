import type Joplin from '@joplin/lib/services/plugins/api/Joplin';
import { PluginMainProcessApi, PluginWebViewApi } from '../types';
import reportUnhandledErrors from './utils/reportUnhandledErrors';
import WebViewToRNMessenger from '../../../utils/ipc/WebViewToRNMessenger';
import wrapConsoleLog from './utils/wrapConsoleLog';

interface ExtendedWindow extends Window {
	joplin: Joplin;
}
declare const window: ExtendedWindow;

const runPlugin = async (
	pluginScriptText: string, messageChannelId: string, pluginId: string,
) => {
	console.log('run plugin start');
	const initialJavaScript = `
		"use strict";
		console.log('run initial js');

		(async () => {
			window.require = function(module) {
				return pluginBackgroundPage.requireModule(module, ${JSON.stringify(pluginId)});
			};
			window.exports = window.exports || {};

			${pluginScriptText}
		})();
	`;
	const pluginScriptElement = document.createElement('script');
	pluginScriptElement.appendChild(document.createTextNode(initialJavaScript));

	const localApi = { };
	const messenger = new WebViewToRNMessenger<PluginWebViewApi, PluginMainProcessApi>(messageChannelId, localApi);

	console.log('run plugin wait for messenger');
	await messenger.awaitRemoteReady();
	console.log('run plugin wait for messenger done');

	if (!window.joplin) {
		window.joplin = messenger.remoteApi.api.joplin;

		reportUnhandledErrors(messenger.remoteApi.onError);
		wrapConsoleLog(messenger.remoteApi.onLog);

		document.head.appendChild(pluginScriptElement);
	}
};

export default runPlugin;