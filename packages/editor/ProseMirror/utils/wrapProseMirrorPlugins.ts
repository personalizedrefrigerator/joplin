import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';

type PluginOrExtension = Plugin|Extension;


const wrapProseMirrorPlugin = (plugin: Plugin) => (
	Extension.create({
		addProseMirrorPlugins: () => {
			if (!(plugin instanceof Plugin)) {
				throw new Error(`Not a plugin: ${plugin}`);
			}

			if (Array.isArray(plugin)) {
				return plugin;
			}
			return [plugin];
		},
	})
);

const wrapProseMirrorPlugins = (plugins: Plugin|PluginOrExtension[]) => {
	const result: Extension[] = [];
	if (!Array.isArray(plugins)) {
		return [wrapProseMirrorPlugin(plugins)];
	}

	for (const plugin of plugins) {
		if (plugin instanceof Plugin) {
			result.push(wrapProseMirrorPlugin(plugin));
		} else {
			result.push(plugin);
		}
	}

	return result;
};

export default wrapProseMirrorPlugins;
