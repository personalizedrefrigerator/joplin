import { ContentScriptType } from '@joplin/lib/services/plugins/api/types';
import { PluginStates } from '@joplin/lib/services/plugins/reducer';
import shim from '@joplin/lib/shim';
import { ContentScriptRecord } from '../types';
import { dirname } from 'path';

const readPluginFiles = async (plugins: PluginStates) => {
	const pluginData: ContentScriptRecord[] = [];
	const loadPluginTasks: Promise<void>[] = [];

	for (const pluginId in plugins) {
		const contentScripts = plugins[pluginId].contentScripts[ContentScriptType.MarkdownItPlugin];
		if (!contentScripts) continue;

		for (const contentScript of contentScripts) {
			loadPluginTasks.push((async () => {
				const filePath = contentScript.path;
				const scriptContent = await shim.fsDriver().readFile(filePath, 'utf-8');

				pluginData.push({
					pluginId,
					contentScriptId: contentScript.id,
					script: scriptContent,
					assetPath: dirname(filePath),
				});
			})());
		}
	}

	await Promise.all(loadPluginTasks);

	return pluginData;
};

export default readPluginFiles;
