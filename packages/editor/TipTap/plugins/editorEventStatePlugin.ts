import { EditorState, Plugin, Transaction } from 'prosemirror-state';
import { EditorEvent } from '../../events';
import { OnEventCallback } from '../../types';

export const getEditorEventHandler = (state: EditorState) => {
	return editorEventStatePlugin.getState(state);
};

export const setEditorEventHandler = (transaction: Transaction, eventHandler: OnEventCallback) => {
	return transaction.setMeta(editorEventStatePlugin, eventHandler);
};

// Stores the editor event handler callback in the editor state.
const editorEventStatePlugin = new Plugin({
	state: {
		init: () => ((_event: EditorEvent)=>{}),
		apply: (tr, value) => {
			const proposedValue = tr.getMeta(editorEventStatePlugin);
			if (proposedValue) {
				return proposedValue;
			}
			return value;
		},
	},
});

export default editorEventStatePlugin;
