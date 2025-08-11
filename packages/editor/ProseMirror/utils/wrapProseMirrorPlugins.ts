import { Extension } from '@tiptap/core';
import { Plugin } from 'prosemirror-state';

type PluginOrPlugins = Plugin|Plugin[];

const wrapProseMirrorPlugins = (plugins: PluginOrPlugins|PluginOrPlugins[]) => {
	return Extension.create({
		addProseMirrorPlugins: () => {
			if (Array.isArray(plugins)) {
				return plugins.flat();
			}
			return [plugins];
		},
	});
};

export default wrapProseMirrorPlugins;
