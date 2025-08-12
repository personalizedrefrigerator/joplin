import DocumentNode from '@tiptap/extension-document';
import TextNode from '@tiptap/extension-text';
import { Focus, UndoRedo, Dropcursor, Gapcursor } from '@tiptap/extensions';
import { Image } from '@tiptap/extension-image';
import { TableKit } from '@tiptap/extension-table';
import joplinEditablePlugin from './plugins/joplinEditablePlugin/joplinEditablePlugin';
import Link from '@tiptap/extension-link';
import joplinEditorApiPlugin from './plugins/joplinEditorApiPlugin';
import linkTooltipPlugin from './plugins/linkTooltipPlugin';
import resourcePlaceholderPlugin from './plugins/resourcePlaceholderPlugin';
import HardBreak from '@tiptap/extension-hard-break';
import keymapPlugin from './plugins/keymapPlugin';
import Code from '@tiptap/extension-code';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import SubScript from '@tiptap/extension-subscript';
import SuperScript from '@tiptap/extension-superscript';
import BlockQuote from '@tiptap/extension-blockquote';
import Heading from '@tiptap/extension-heading';
import Highlight from '@tiptap/extension-highlight';
import Paragraph from '@tiptap/extension-paragraph';
import listPlugin from './plugins/listPlugin';
import { Node } from '@tiptap/core';
import inputRulesPlugin from './plugins/inputRulesPlugin';

const buildDefaultPlugins = () => {
	const plugins = [
		keymapPlugin,
		inputRulesPlugin,
		joplinEditablePlugin,
		DocumentNode,
		TextNode,
		Paragraph,
		Focus,
		UndoRedo,
		Gapcursor,
		Dropcursor,
		Code.configure({
			HTMLAttributes: { class: 'inline-code' },
		}),
		listPlugin,
		Image.configure({
			inline: true,
			allowBase64: true,
		}).extend({
			addAttributes: () => ({
				'src': {
					default: null as string|null,
					validate: 'string|null',
				},
				'title': {
					default: null as string|null,
					validate: 'string|null',
				},
				'alt': {
					default: null as string|null,
					validate: 'string|null',
				},
				'data-from-md': {
					default: null as false|null,
					validate: 'boolean|null',
					parseHTML: (html) => {
						return html.hasAttribute('data-from-md') || null;
					},
				},
				'data-resource-id': {
					default: null as string|null,
					validate: 'string|null',
					parseHTML: (html) => {
						return html.getAttribute('data-resource-id') || null;
					},
				},
			}),
		}),
		TableKit,
		HardBreak,
		Bold,
		Italic,
		BlockQuote,
		SubScript,
		SuperScript,
		Heading,
		Highlight,
		Link.configure({
			openOnClick: false,
			protocols: ['joplin', 'http', 'https'],
			isAllowedUri(url, ctx) {
				return ctx.defaultValidate(url) || !!url.match(/^:\/[a-zA-Z]{32}$/);
			},
		}),
		resourcePlaceholderPlugin,
		linkTooltipPlugin,
		joplinEditorApiPlugin,
	].flat();
	const blockNodeNames = plugins.map(plugin => {
		if (plugin instanceof Node && !plugin.config.inline) {
			if (typeof plugin.config.group === 'string' && plugin.config.group.includes('block')) {
				return plugin.name;
			}
		}
		return null;
	}).filter(item => !!item);

	return {
		plugins,
		nodeTypes: blockNodeNames,
	};
};

export default buildDefaultPlugins;
