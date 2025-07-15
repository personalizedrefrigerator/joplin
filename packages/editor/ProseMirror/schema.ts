import { DOMOutputSpec, MarkSpec, NodeSpec, Schema } from 'prosemirror-model';

const domOutputSpecs = {
	paragraph: ['p', 0],
	strong: ['strong', 0],
} satisfies Record<string, DOMOutputSpec>;

const nodes = {
	doc: { content: 'block+' },
	paragraph: {
		group: 'block',
		content: 'inline*',
		parseDOM: [{ tag: 'p' }],
		toDOM: () => domOutputSpecs.paragraph,
	},
	text: {
		group: 'inline',
	},
} satisfies Record<string, NodeSpec>;

const marks = {
	strong: {
		parseDOM: [{ tag: 'strong' }, { tag: 'b' }],
		toDOM: () => domOutputSpecs.strong,
	},
} satisfies Record<string, MarkSpec>;

const schema: Schema = new Schema({
	marks, nodes,
});

export default schema;
