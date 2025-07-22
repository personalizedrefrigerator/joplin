import { AttributeSpec, DOMOutputSpec, MarkSpec, NodeSpec, Schema } from 'prosemirror-model';
import { nodeSpecs as joplinEditableNodes } from './plugins/joplinEditablePlugin';
import { tableNodes } from 'prosemirror-tables';
import { nodeSpecs as taskListNodes } from './plugins/taskListPlugin';

// For reference, see:
// - https://prosemirror.net/docs/guide/#schema
// - https://github.com/ProseMirror/prosemirror-schema-basic/blob/master/src/schema-basic.ts

const domOutputSpecs = {
	paragraph: ['p', 0],
	strong: ['strong', 0],
	code: ['code', { class: 'inline-code', spellcheck: false }, 0],
	emphasis: ['em', 0],
	pre: ['pre', { class: 'code-block' }, ['code', 0]],
	br: ['br'],
	orderedList: ['ol', 0],
	unorderedList: ['ul', 0],
	listItem: ['li', 0],
	blockQuote: ['blockquote', 0],
	hr: ['hr'],
} satisfies Record<string, DOMOutputSpec>;

type AttributeSpecs = Record<string, AttributeSpec>;

// Default attributes that should be valid for all toplevel blocks:
const defaultToplevelAttrs: AttributeSpecs = {
	// Stores the original markdown used to generate a node.
	originalMarkup: { default: '', validate: 'string' },
};
const getDefaultToplevelAttrs = (node: Element) => ({
	originalMarkup: node.getAttribute('data-original-markup'),
});

const listGroup = 'block';

const nodes = {
	doc: { content: 'block+' },
	paragraph: {
		group: 'block',
		content: '(inline|hard_break)*',
		parseDOM: [{ tag: 'p', getAttrs: getDefaultToplevelAttrs }],
		attrs: defaultToplevelAttrs,
		toDOM: () => domOutputSpecs.paragraph,
	},
	heading: { // See prosemirror-schema-basic's `heading`
		attrs: {
			...defaultToplevelAttrs,
			level: { default: 2, validate: 'number' },
		},
		group: 'block',
		content: 'inline*',
		parseDOM: [1, 2, 3, 4, 5, 6].map(level => ({
			tag: `h${level}`, getAttrs: node => ({ ...getDefaultToplevelAttrs(node), level }),
		})),
		toDOM: (node) => [`h${node.attrs.level}`, 0],
	},
	pre_block: {
		content: 'text*',
		group: 'block',
		marks: '',
		code: true,
		defining: true, // Preserve the node during replacement operations
		parseDOM: [{ tag: 'pre', getAttrs: getDefaultToplevelAttrs }],
		toDOM: () => domOutputSpecs.pre,

		attrs: defaultToplevelAttrs,
	},
	blockquote: {
		content: 'block+',
		group: 'block',
		parseDOM: [{ tag: 'blockquote', getAttrs: getDefaultToplevelAttrs }],
		toDOM: () => domOutputSpecs.blockQuote,
		attrs: defaultToplevelAttrs,
	},
	horizontal_rule: {
		group: 'block',
		parseDOM: [{ tag: 'hr' }],
		toDOM: () => domOutputSpecs.hr,
	},
	...taskListNodes,
	ordered_list: {
		content: 'list_item+',
		group: listGroup,

		// Match attributes from https://github.com/ProseMirror/prosemirror-schema-list/blob/master/src/schema-list.ts
		attrs: { order: { default: 1, validate: 'number' }, ...defaultToplevelAttrs },
		parseDOM: [
			{
				tag: 'ol',
				getAttrs: node => {
					const start = node.hasAttribute('start') ? Number(node.getAttribute('start')) : 1;
					return {
						...getDefaultToplevelAttrs(node),
						order: isFinite(start) ? start : 1,
					};
				},
			},
		],
		toDOM: node => (
			node.attrs.order === 1 ? domOutputSpecs.orderedList : ['ol', { start: node.attrs.order }, 0]
		),
	},
	bullet_list: {
		content: 'list_item+',
		group: listGroup,

		parseDOM: [{ tag: 'ul:not([data-is-checklist])', getAttrs: getDefaultToplevelAttrs }],
		toDOM: () => domOutputSpecs.unorderedList,
		attrs: defaultToplevelAttrs,
	},
	list_item: {
		content: 'paragraph block*',
		parseDOM: [{ tag: 'li:not(.md-checkbox)', getAttrs: getDefaultToplevelAttrs }],
		toDOM: () => domOutputSpecs.listItem,
		attrs: defaultToplevelAttrs,
	},
	...joplinEditableNodes,
	...tableNodes({
		tableGroup: 'block',
		cellContent: 'inline*',
		cellAttributes: {},
	}),
	// Override the default `table` node to include the default toplevel attributes
	table: {
		content: 'table_row+',
		tableRole: 'table',
		isolating: true,
		group: 'block',
		parseDOM: [{ tag: 'table', getAttrs: getDefaultToplevelAttrs }],
		toDOM: () => ['table', ['tbody', 0]],
		attrs: defaultToplevelAttrs,
	},

	text: {
		group: 'inline',
	},
	image: {
		group: 'inline',
		inline: true,
		draggable: true,
		attrs: {
			src: { default: '', validate: 'string' },
			alt: { default: '', validate: 'string' },
			title: { default: '', validate: 'string' },
			fromMd: { default: false, validate: 'boolean' },
			resourceId: { default: null as string|null, validate: 'string|null' },
		},
		parseDOM: [
			{
				tag: 'img[src]',
				getAttrs: node => ({
					src: node.getAttribute('src'),
					alt: node.getAttribute('alt'),
					title: node.getAttribute('title'),
					fromMd: node.hasAttribute('data-from-md'),
					resourceId: node.getAttribute('data-resource-id') || null,
				}),
			},
		],
		toDOM: node => {
			const { src, alt, title, fromMd, resourceId } = node.attrs;
			const outputAttrs: Record<string, unknown> = { src, alt, title };

			if (fromMd) {
				outputAttrs['data-from-md'] = true;
			}
			if (resourceId) {
				outputAttrs['data-resource-id'] = resourceId;
			}

			return [
				'img',
				outputAttrs,
			];
		},
	},
	hard_break: {
		inline: true,
		group: 'inlineBreak',
		selectable: false,
		parseDOM: [{ tag: 'br' }],
		toDOM: () => domOutputSpecs.br,
	},
} satisfies Record<string, NodeSpec>;

const marks = {
	strong: {
		parseDOM: [{ tag: 'strong' }, { tag: 'b' }],
		toDOM: () => domOutputSpecs.strong,
	},
	emphasis: {
		parseDOM: [{ tag: 'em' }],
		toDOM: () => domOutputSpecs.emphasis,
	},
	code: {
		parseDOM: [{ tag: 'code' }],
		code: true,
		toDOM: () => domOutputSpecs.code,
		excludes: '_',
	},
	link: {
		attrs: {
			href: { validate: 'string' },
			title: { default: '', validate: 'string' },
		},
		inclusive: false,
		parseDOM: [{
			tag: 'a[href]',
			getAttrs: node => ({
				href: node.getAttribute('href'),
				title: node.getAttribute('title'),
			}),
		}],
		toDOM: node => [
			'a',
			{ href: node.attrs.href, title: node.attrs.title },
		],
	},
} satisfies Record<string, MarkSpec>;

type NodeKeys = keyof typeof nodes;
type MarkKeys = keyof typeof marks;

const schema = new Schema<NodeKeys, MarkKeys>({
	marks,
	nodes,
});

export default schema;
