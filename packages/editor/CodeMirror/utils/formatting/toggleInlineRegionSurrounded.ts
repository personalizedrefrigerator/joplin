import { EditorSelection, EditorState, SelectionRange } from '@codemirror/state';
import { RegionSpec } from './RegionSpec';
import findInlineMatch, { MatchSide } from './findInlineMatch';
import { SelectionUpdate } from './types';
import { EditorView } from '@codemirror/view';

// Toggles whether the given selection matches the inline region specified by [spec].
//
// For example, something similar to toggleSurrounded('**', '**') would surround
// every selection range with asterisks (including the caret).
// If the selection is already surrounded by these characters, they are
// removed.
const toggleInlineRegionSurrounded = (
	state: EditorState, sel: SelectionRange, spec: RegionSpec,
): SelectionUpdate => {
	const doc = state.doc;
	let content = doc.sliceString(sel.from, sel.to);
	const startMatchLen = findInlineMatch(doc, spec, sel, MatchSide.Start);
	const endMatchLen = findInlineMatch(doc, spec, sel, MatchSide.End);

	const startsWithBefore = startMatchLen >= 0;
	const endsWithAfter = endMatchLen >= 0;

	const changes = [];
	let finalSelStart = sel.from;
	let finalSelEnd = sel.to;
	let announcement;

	if (startsWithBefore && endsWithAfter) {
		// Remove the before and after.
		content = content.substring(startMatchLen);
		content = content.substring(0, content.length - endMatchLen);

		finalSelEnd -= startMatchLen + endMatchLen;

		changes.push({
			from: sel.from,
			to: sel.to,
			insert: content,
		});

		announcement = state.phrase('Removed $ markup', spec.accessibleName);
	} else {
		changes.push({
			from: sel.from,
			insert: spec.template.start,
		});

		changes.push({
			from: sel.to,
			insert: spec.template.end,
		});

		// If not a caret,
		if (!sel.empty) {
			// Select the surrounding chars.
			finalSelEnd += spec.template.start.length + spec.template.end.length;
		} else {
			// Position the caret within the added content.
			finalSelStart = sel.from + spec.template.start.length;
			finalSelEnd = finalSelStart;
		}
		announcement = state.phrase('Added $ markup', spec.accessibleName);
	}

	return {
		changes,
		range: EditorSelection.range(finalSelStart, finalSelEnd),
		effects: [
			EditorView.announce.of(announcement),
		],
	};
};

export default toggleInlineRegionSurrounded;
