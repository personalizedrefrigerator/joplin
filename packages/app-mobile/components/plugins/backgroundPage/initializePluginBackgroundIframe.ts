import WindowMessenger from '@joplin/lib/utils/ipc/WindowMessenger';
import { PluginMainProcessApi, PluginWebViewApi } from '../types';
import reportUnhandledErrors from './utils/reportUnhandledErrors';
import wrapConsoleLog from './utils/wrapConsoleLog';
import type Joplin from '@joplin/lib/services/plugins/api/Joplin';

interface ExtendedWindow extends Window {
	joplin: Joplin;
}

declare const window: ExtendedWindow;

export const initializePluginBackgroundIframe = async (messageChannelId: string) => {
	const localApi = { };
	const messenger = new WindowMessenger<PluginWebViewApi, PluginMainProcessApi>(messageChannelId, parent, localApi);
	await messenger.awaitRemoteReady();

	window.joplin = messenger.remoteApi.api.joplin;

	reportUnhandledErrors(messenger.remoteApi.onError);
	wrapConsoleLog(messenger.remoteApi.onLog);
};

export default initializePluginBackgroundIframe;
