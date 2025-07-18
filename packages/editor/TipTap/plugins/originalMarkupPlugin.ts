import { EditorState, Plugin } from 'prosemirror-state';
import { Node as ProseMirrorNode, DOMSerializer, Schema } from 'prosemirror-model';
import { Decoration, DecorationSet } from 'prosemirror-view';
import changedDescendants from '../vendor/changedDescendants';
import { Extension } from '@tiptap/core';

const originalMarkupPlugin = (htmlToMarkup: (html: Node)=> string) => {
	let schema: Schema;
	let serializer_: DOMSerializer;
	const proseMirrorSerializer = () => {
		serializer_ ??= DOMSerializer.fromSchema(schema);
		return serializer_;
	};

	const makeDecoration = (position: number, node: ProseMirrorNode, markup: string) => {
		return Decoration.node(
			position,
			position + node.nodeSize,
			{ 'data-markup': markup }, // For debugging
			{ markup },
		);
	};

	const addMissingMarkup = (doc: ProseMirrorNode, decorations: DecorationSet) => {
		doc.content.nodesBetween(0, doc.content.size, (node: ProseMirrorNode, position: number) => {
			// All markup decorations that cover the start of the node and the next character
			const possibleDecorations = decorations.find(position, position + 1);
			// Only consider the decorations that match the node's boundaries exactly.
			const matchingDecorations = possibleDecorations.filter(decoration => {
				return decoration.from === position && decoration.to === position + node.nodeSize;
			});

			if (matchingDecorations.length === 0) {
				const markup = htmlToMarkup(proseMirrorSerializer().serializeNode(node));
				decorations = decorations.add(doc, [makeDecoration(position, node, markup)]);
			}

			// Only visit toplevel nodes
			return false;
		});

		return decorations;
	};

	const plugin = new Plugin<DecorationSet>({
		state: {
			init: (_config, state) => {
				let decorations = DecorationSet.empty;
				state.doc.nodesBetween(0, state.doc.content.size, (node, position) => {
					const originalMarkup = node.attrs.originalMarkup;
					if (originalMarkup?.trim()) {
						decorations = decorations.add(state.doc, [makeDecoration(position, node, node.attrs.originalMarkup)]);
					}

					return false;
				});
				return addMissingMarkup(state.doc, decorations);
			},
			apply: (tr, value, oldState, newState) => {
				value = value.map(tr.mapping, tr.doc);

				// Remove all outdated values
				changedDescendants(oldState.doc, newState.doc, 0, (node, pos) => {
					const oldDecorations = value.find(pos, pos + node.nodeSize);
					value = value.remove(oldDecorations);
				});

				value = addMissingMarkup(tr.doc, value);

				return value;
			},
		},
		props: {
			decorations(state) { return this.getState(state); },
		},
	});

	return {
		plugin: Extension.create({
			addProseMirrorPlugins() {
				schema = this.editor.schema;
				return [plugin];
			},
		}),
		stateToMarkup: (state: EditorState) => {
			const decorations = plugin.getState(state).find();
			// Sort the decorations in increasing order -- the documentation does not guarantee
			// that the decorations will be returned by .find() in any particular order.
			decorations.sort((a, b) => a.from - b.from);

			const result = [];
			for (const decoration of decorations) {
				const markup: string = decoration.spec.markup;
				result.push(markup);

				if (!markup.endsWith('\n\n')) {
					result.push('\n\n');
				}
			}

			return result.join('');
		},
	};
};

export default originalMarkupPlugin;
