import { EditorSelection, SelectionRange, EditorState } from '@codemirror/state';
import { RegionSpec } from './RegionSpec';
import { SelectionUpdate } from './types';
import findInlineMatch, { MatchSide } from './findInlineMatch';
import growSelectionToNode from '../growSelectionToNode';
import toggleInlineRegionSurrounded from './toggleInlineRegionSurrounded';
import { EditorView } from '@codemirror/view';
import { _ } from '@joplin/lib/locale';

// Returns updated selections: For all selections in the given `EditorState`, toggles
// whether each is contained in an inline region of type [spec].
const toggleInlineSelectionFormat = (
	state: EditorState, spec: RegionSpec, sel: SelectionRange,
): SelectionUpdate => {
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
			effects: [
				EditorView.announce.of(
					_('Moved cursor out of %s markup', spec.accessibleName),
				),
			],
		};
	}

	// Grow the selection to encompass the entire node.
	const newRange = growSelectionToNode(state, sel, spec.nodeName);
	return toggleInlineRegionSurrounded(state, newRange, spec);
};

export default toggleInlineSelectionFormat;
