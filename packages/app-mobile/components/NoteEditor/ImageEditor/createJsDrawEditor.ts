
import Editor, { HTMLToolbar } from 'js-draw';
import 'js-draw/bundle';

export const createJsDrawEditor = (): Editor => {
	const parentElement = document.body;
	const editor = new Editor(parentElement);

	return editor;
};

const editorStateLocalStorageKey = 'toolbarStateStore';
export const saveToolbarState = (toolbar: HTMLToolbar) => {
	localStorage.setItem(editorStateLocalStorageKey, toolbar.serializeState());
};

export const restoreToolbarState = (toolbar: HTMLToolbar) => {
	const state = localStorage.getItem(editorStateLocalStorageKey);
	if (state) {
		// deserializeState throws on invalid argument.
		try {
			toolbar.deserializeState(state);
		} catch (e) {
			console.warn('Error deserializing toolbar state: ', e);
		}
	}
};

export default createJsDrawEditor;
