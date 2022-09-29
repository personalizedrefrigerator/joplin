
import Editor from 'js-draw';
import 'js-draw/bundle';

export const createJsDrawEditor = (): Editor => {
	const parentElement = document.body;
	const editor = new Editor(parentElement);

	return editor;
};

export default createJsDrawEditor;
