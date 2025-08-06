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
	dialog.classList.add('editor-dialog');
	document.body.appendChild(dialog);
	dialog.showModal();

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
	submitButton.onclick = () => {
		dialog.close();
	};

	dialog.appendChild(editor);
	dialog.appendChild(submitButton);

	return {};
};

export default createEditorDialog;
