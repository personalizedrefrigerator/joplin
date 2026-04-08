import PluginService from '@joplin/lib/services/plugins/PluginService';

interface WebViewApi {
	postMessage: (contentScriptId: string, message: unknown)=> Promise<unknown>;
}

interface ExtendedWindow extends Window {
	webviewApi: WebViewApi;
}

const setUpWebviewApi = (window: Window) => {
	const webviewApi: WebViewApi = {
		postMessage: async (contentScriptId: string, message: unknown) => {
			const pluginService = PluginService.instance();
			const plugin = pluginService.pluginById(
				pluginService.pluginIdByContentScriptId(contentScriptId),
			);
			return await plugin.emitContentScriptMessage(contentScriptId, message);
		},
	};
	const extendedWindow = window as ExtendedWindow;
	extendedWindow.webviewApi = webviewApi;

	return {
		remove: () => {
			if (extendedWindow.webviewApi === webviewApi) {
				extendedWindow.webviewApi = undefined;
			}
		},
	};
};

export default setUpWebviewApi;
