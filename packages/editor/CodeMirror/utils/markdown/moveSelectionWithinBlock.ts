import { EditorSelection, EditorState, SelectionRange } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';

// Moves the start/end of the given selection range within block-level formatting markers.
const moveSelectionWithinBlock = (selectionRange: SelectionRange, state: EditorState) => {
	let from = selectionRange.from;
	const fromLine = state.doc.lineAt(from);

	syntaxTree(state).iterate({
		from: fromLine.from,
		to: fromLine.to,
		enter: (node) => {
			if (node.name === 'ListMark' || node.name === 'QuoteMark' || node.name === 'HeaderMark') {
				from = Math.max(from, node.to);
			}
		},
	});

	return EditorSelection.range(from, selectionRange.to);
};

export default moveSelectionWithinBlock;
