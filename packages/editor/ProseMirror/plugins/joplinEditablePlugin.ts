import { Plugin } from 'prosemirror-state';
import { Node } from 'prosemirror-model';
import { NodeView } from 'prosemirror-view';
import sanitizeHtml from '../utils/sanitizeHtml';
import { Extension, NodeConfig, Node as TipTapNode } from '@tiptap/core';

// See the fold example for more information about
// writing similar ProseMirror plugins:
// https://prosemirror.net/examples/fold/


const makeJoplinEditableSpec = (inline: boolean): NodeConfig => ({
	name: `joplin-editable-${inline}`,
	group: inline ? 'inline' : 'block',
	inline: inline,
	draggable: true,
	addAttributes: () => ({
		contentHtml: { default: '', validate: 'string' },
	}),
	parseHTML: () => [
		{
			tag: `${inline ? 'span' : 'div'}.joplin-editable`,
			getAttrs: node => ({
				contentHtml: node.innerHTML,
			}),
		},
	],
	renderHTML: ({ node, HTMLAttributes }) => {
		const content = document.createElement(inline ? 'span' : 'div');
		content.classList.add('joplin-editable');
		content.innerHTML = sanitizeHtml(node.attrs.contentHtml);
		for (const [key, value] of Object.entries(HTMLAttributes)) {
			content.setAttribute(key, value);
		}

		return content;
	},
});

class SourceBlockView implements NodeView {
	public readonly dom: HTMLElement;
	public constructor(node: Node, inline: boolean) {
		if ((node.attrs.contentHtml ?? undefined) === undefined) {
			throw new Error(`Unable to create a SourceBlockView for a node lacking contentHtml. Node: ${node}.`);
		}

		this.dom = document.createElement(inline ? 'span' : 'div');
		this.dom.classList.add('joplin-editable');
		this.dom.innerHTML = sanitizeHtml(node.attrs.contentHtml);
	}

	public selectNode() {
		this.dom.classList.add('-selected');
	}

	public deselectNode() {
		this.dom.classList.remove('-selected');
	}
}

const proseMirrorPlugin = new Plugin({
	props: {
		nodeViews: {
			joplinEditableInline: node => new SourceBlockView(node, true),
			joplinEditableBlock: node => new SourceBlockView(node, false),
		},
	},
});

export default [
	Extension.create({
		addProseMirrorPlugins() {
			return [proseMirrorPlugin];
		},
	}),
	TipTapNode.create({
		...makeJoplinEditableSpec(true),
	}),
	TipTapNode.create({
		...makeJoplinEditableSpec(false),
	}),
];
