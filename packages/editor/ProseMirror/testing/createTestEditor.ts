import { Editor, Extension } from '@tiptap/core';
import buildDefaultPlugins from '../buildDefaultPlugins';

type PluginList = Extension|Extension[]|(Extension|Extension[])[];

interface Options {
	parent?: HTMLElement;
	html: string;
	plugins?: PluginList;
}

const unique = <T> (data: T[]) => {
	return [...new Set(data)];
};

const createTestEditor = ({ html, parent = null, plugins = [] }: Options) => {
	if (!Array.isArray(plugins)) {
		plugins = [plugins];
	}

	parent ??= document.createElement('div');

	return new Editor({
		element: parent,
		content: html,
		extensions: unique([
			...plugins,
			...buildDefaultPlugins().plugins,
		].flat()),
	});
};

export default createTestEditor;
