import { DOMOutputSpec, MarkSpec, NodeSpec, Schema } from 'prosemirror-model';
import sanitizeHtml from './utils/sanitizeHtml';
import { addListNodes } from 'prosemirror-schema-list';
import OrderedMap from 'orderedmap';

const domOutputSpecs = {
	paragraph: ['p', 0],
	strong: ['strong', 0],
	code: ['code', { class: 'inline-code', spellcheck: false }, 0],
	emphasis: ['em', 0],
} satisfies Record<string, DOMOutputSpec>;

const makeJoplinEditableSpec = (inline: boolean): NodeSpec => ({
	group: inline ? 'inline' : 'block',
	inline: inline,
	draggable: true,
	attrs: {
		contentHtml: { default: '', validate: 'string' },
	},
	parseDOM: [
		{
			tag: `${inline ? 'span' : 'div'}.joplin-editable`,
			getAttrs: node => ({
				contentHtml: node.innerHTML,
			}),
		},
	],
	toDOM: node => {
		const content = document.createElement(inline ? 'span' : 'div');
		content.classList.add('joplin-editable');
		content.innerHTML = sanitizeHtml(node.attrs.contentHtml);
		return content;
	},
});

const nodes = {
	doc: { content: 'block+' },
	paragraph: {
		group: 'block',
		content: 'inline*',
		parseDOM: [{ tag: 'p' }],
		toDOM: () => domOutputSpecs.paragraph,
	},
	heading: { // See prosemirror-schema-basic's `heading`
		attrs: { level: { default: 2, validate: 'number' } },
		group: 'block',
		content: 'inline*',
		parseDOM: [1, 2, 3, 4, 5, 6].map(level => ({ tag: `h${level}`, attrs: { level } })),
		toDOM: (node) => [`h${node.attrs.level}`, 0],
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
	joplinEditableInline: makeJoplinEditableSpec(true),
	joplinEditableBlock: makeJoplinEditableSpec(false),
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
		toDOM: () => domOutputSpecs.code,
		excludes: '_',
	},
} satisfies Record<string, MarkSpec>;

type NodeKeys = (keyof typeof nodes)|'ordered_list'|'bullet_list'|'list_item';
type MarkKeys = keyof typeof marks;

const schema = new Schema<NodeKeys, MarkKeys>({
	marks,
	nodes: addListNodes(OrderedMap.from(nodes), 'paragraph block*', 'block'),
});

export default schema;
