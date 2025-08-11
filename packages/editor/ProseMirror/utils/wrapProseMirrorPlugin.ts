import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';

const wrapProseMirrorPlugin = (plugins: Plugin|Plugin[]) => {
	return Extension.create({
		addProseMirrorPlugins: () => {
			if (Array.isArray(plugins)) {
				return plugins;
			}
			return [plugins];
		},
	});
};

export default wrapProseMirrorPlugin;
