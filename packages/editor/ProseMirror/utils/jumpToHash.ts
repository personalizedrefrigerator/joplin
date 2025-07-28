import { Command, TextSelection } from 'prosemirror-state';
import uslug from '@joplin/fork-uslug/lib/uslug';
import { NodeType } from 'prosemirror-model';

const jumpToHash = (targetHash: string, headingType: NodeType): Command => (state, dispatch) => {
	let targetHeaderPos: number|null = null;
	state.doc.descendants((node, pos) => {
		if (node.type === headingType) {
			const hash = uslug(node.textContent);
			if (hash === targetHash) {
				targetHeaderPos = pos + node.nodeSize;
			}
		}

		return targetHeaderPos !== null;
	});

	if (targetHeaderPos !== null) {
		const newSelection = TextSelection.create(state.doc, targetHeaderPos);
		if (dispatch) {
			dispatch(
				state.tr.setSelection(newSelection)
					.scrollIntoView(),
			);
		}

		return true;
	}

	return false;
};

export default jumpToHash;
