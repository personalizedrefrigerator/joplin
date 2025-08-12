import { Extension } from '@tiptap/core';
import { Plugin } from 'prosemirror-state';

type PluginOrPlugins = Plugin|Plugin[];

let id = 0;
const wrapProseMirrorPlugins = (plugins: PluginOrPlugins|PluginOrPlugins[]) => {
	return Extension.create({
		name: `wrapProseMirrorPlugins-${id++}`,
		addProseMirrorPlugins: () => {
			if (Array.isArray(plugins)) {
				return plugins.flat();
			}
			return [plugins];
		},
	});
};

export default wrapProseMirrorPlugins;
