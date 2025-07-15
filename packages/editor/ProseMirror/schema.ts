import { DOMOutputSpec, MarkSpec, NodeSpec, Schema } from 'prosemirror-model';

const domOutputSpecs = {
	paragraph: ['p', 0],
	strong: ['strong', 0],
	code: ['code', 0],
	emphasis: ['em', 0],
} satisfies Record<string, DOMOutputSpec>;

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

const schema: Schema = new Schema({
	marks, nodes,
});

export default schema;
