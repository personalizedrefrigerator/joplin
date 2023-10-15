import { ContentScriptContext } from '@joplin/lib/services/plugins/api/types';
import { ContentScriptRecord } from '../types';
import { ExtraContentScript } from '@joplin/lib/services/plugins/utils/loadContentScripts';

type OnErrorCallback = (error: Error)=> void;

const loadContentScripts = async (contentScripts: ContentScriptRecord[], onError: OnErrorCallback) => {
	const output: ExtraContentScript[] = [];

	for (const contentScript of contentScripts) {
		try {
			const exports: any = Object.create(null);

			(() => {
				eval(contentScript.script);
			})();

			const pluginInformation = `Plugin: ${contentScript.pluginId}: Script: ${contentScript.contentScriptId}`;

			if (!exports.default || typeof exports.default !== 'function') {
				throw new Error(`Content script must export a function under the "default" key: ${pluginInformation}`);
			}

			const context: ContentScriptContext = {
				pluginId: contentScript.pluginId,
				contentScriptId: contentScript.contentScriptId,
				postMessage: () => {
					throw new Error(`postMessage unavailable in renderer content scripts. ${pluginInformation}`);
				},
			};

			const loadedModule = exports.default(context);
			if (!loadedModule.plugin) {
				throw new Error(`Content script must export a function that returns an object with a "plugin" key. ${pluginInformation}`);
			}

			output.push({
				id: contentScript.contentScriptId,
				module: loadedModule,
				assetPath: contentScript.assetPath,
			});
		} catch (error) {
			// Catch each error, so a single plugin failing to load
			// doesn't prevent the renderer from functioning.
			onError(error);
		}
	}

	return output;
};

export default loadContentScripts;
