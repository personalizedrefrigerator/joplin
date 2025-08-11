import { EditorView } from '@codemirror/view';
import { Prec } from '@codemirror/state';

const hasMultipleCursors = (view: EditorView) => {
	return view.state.selection.ranges.length > 1;
};

type OnCtrlClick = (view: EditorView, event: MouseEvent)=> boolean;

const ctrlClickActionExtension = (onCtrlClick: OnCtrlClick) => {
	return [
		Prec.high([
			EditorView.domEventHandlers({
				mousedown: (event: MouseEvent, view: EditorView) => {
					const hasModifier = event.ctrlKey || event.metaKey;
					// The default CodeMirror action for ctrl-click is to add another cursor
					// to the document. If the user already has multiple cursors, assume that
					// the ctrl-click action is intended to add another.
					if (hasModifier && !hasMultipleCursors(view)) {
						const handled = onCtrlClick(view, event);
						if (handled) {
							event.preventDefault();
							return true;
						}
					}
					return false;
				},
			}),
		]),
	];
};

export default ctrlClickActionExtension;
