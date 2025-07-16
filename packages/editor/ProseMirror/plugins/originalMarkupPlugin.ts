import { EditorState, Plugin } from 'prosemirror-state';
import { Node as ProseMirrorNode, DOMSerializer } from 'prosemirror-model';
import { Decoration, DecorationSet } from 'prosemirror-view';
import schema from '../schema';
import changedDescendants from '../vendor/changedDescendants';

const originalMarkupPlugin = (htmlToMarkup: (html: Node)=> string) => {
	const proseMirrorSerializer = DOMSerializer.fromSchema(schema);

	const addMissingMarkup = (doc: ProseMirrorNode, decorations: DecorationSet) => {
		doc.content.nodesBetween(0, doc.content.size, (node: ProseMirrorNode, position: number) => {
			const matchingValues = decorations.find(position + 1, position + 1);

			if (matchingValues.length === 0) {
				const markup = htmlToMarkup(proseMirrorSerializer.serializeNode(node));
				decorations = decorations.add(doc, [
					Decoration.node(
						position,
						position + node.nodeSize,
						{ 'data-markup': markup }, // For debugging
						{ markup },
					),
				]);
			}

			// Only visit toplevel nodes
			return false;
		});

		return decorations;
	};

	const plugin = new Plugin<DecorationSet>({
		state: {
			init: (_config, state) => addMissingMarkup(state.doc, DecorationSet.empty),
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
		plugin,
		stateToMarkup: (state: EditorState) => {
			const decorations = plugin.getState(state).find();
			// Sort the decorations in increasing order -- the documentation does not guarantee
			// that the decorations will be returned by .find() in any particular order.
			decorations.sort((a, b) => a.from - b.from);

			return decorations.map(decoration => decoration.spec.markup).join('\n\n');
		},
	};
};

export default originalMarkupPlugin;
