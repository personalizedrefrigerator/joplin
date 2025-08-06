import { focus } from '@joplin/lib/utils/focusHandler';
import createTextNode from '../../utils/dom/createTextNode';

interface SourceBlockData {
	start: string;
	content: string;
	end: string;
}

interface Options {
	doneLabel: string|Promise<string>;
	block: SourceBlockData;
	onSave: (newContent: SourceBlockData)=> void;
}

const createEditorDialog = ({ doneLabel, block, onSave }: Options) => {
	const dialog = document.createElement('dialog');
	dialog.classList.add('editor-dialog', '-visible');
	document.body.appendChild(dialog);

	dialog.onclose = () => {
		dialog.remove();
	};

	const editor = document.createElement('textarea');
	editor.spellcheck = false;
	editor.oninput = () => {
		onSave({
			start: '',
			end: '',
			content: editor.value,
		});
	};
	editor.value = [
		block.start,
		block.content,
		block.end,
	].join('');

	const submitButton = document.createElement('button');
	submitButton.appendChild(createTextNode(doneLabel));
	submitButton.classList.add('submit');
	submitButton.onclick = () => {
		// .remove the dialog in browsers with limited support for
		// HTMLDialogElement (and in JSDOM).
		(dialog.close ?? dialog.remove)();
	};

	dialog.appendChild(editor);
	dialog.appendChild(submitButton);


	// .showModal is not defined in JSDOM and some older (pre-2022) browsers
	if (dialog.showModal) {
		dialog.showModal();
	} else {
		dialog.classList.add('-fake-modal');
		focus('createEditorDialog/legacy', editor);
	}

	return {};
};

export default createEditorDialog;
