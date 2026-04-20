import { EditorSelection, SelectionRange, EditorState, ChangeSet } from '@codemirror/state';
import { RegionSpec } from './RegionSpec';
import { SelectionUpdate } from './types';
import findInlineMatch, { MatchSide } from './findInlineMatch';
import growSelectionToNode from '../growSelectionToNode';
import toggleInlineRegionSurrounded from './toggleInlineRegionSurrounded';
import moveSelectionWithinBlock from '../markdown/moveSelectionWithinBlock';

// Returns updated selections: For all selections in the given `EditorState`, toggles
// whether each is contained in an inline region of type [spec].
const toggleInlineSelectionFormat = (
	state: EditorState, spec: RegionSpec, sel: SelectionRange,
): SelectionUpdate => {
	if (spec.perLine && !sel.empty) {
		let line = state.doc.lineAt(sel.from);

		let changes = ChangeSet.empty(state.doc.length);
		let lastChange = null;
		for (
			let index = line.from;
			index <= sel.to && !!line;
			index = line.from + line.length + 1,
			line = index < state.doc.length ? state.doc.lineAt(index) : null,
			state = lastChange ? state.update({ changes: lastChange, selection: EditorSelection.cursor(0) }).state : state
		) {
			const from = Math.max(line.from, sel.from);
			const to = Math.min(line.to, sel.to);
			let range = EditorSelection.range(from, to);
			range = moveSelectionWithinBlock(range, state);

			const change = toggleInlineSelectionFormat(state, { ...spec, perLine: false }, range);
			lastChange = ChangeSet.of(change.changes, changes.newLength);
			changes = changes.compose(lastChange);
		}

		return {
			range: sel.map(changes, -1),
			changes,
		};
	}

	const endMatchLen = findInlineMatch(state.doc, spec, sel, MatchSide.End);

	// If at the end of the region, move the
	// caret to the end.
	// E.g.
	//   **foobar|**
	//   **foobar**|
	if (sel.empty && endMatchLen > -1) {
		const newCursorPos = sel.from + endMatchLen;

		return {
			range: EditorSelection.cursor(newCursorPos),
		};
	}

	// Grow the selection to encompass the entire node.
	const newRange = growSelectionToNode(state, sel, spec.nodeName);
	return toggleInlineRegionSurrounded(state.doc, newRange, spec);
};

export default toggleInlineSelectionFormat;
