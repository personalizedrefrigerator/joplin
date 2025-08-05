interface SourceBlockData {
	start: string;
	content: string;
	end: string;
}

interface Options {
	block: SourceBlockData;
	onSave: (newContent: SourceBlockData)=> void;
}

const createEditorDialog = ({ block, onSave }: Options) => {
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
	submitButton.textContent = 'Done';
	submitButton.onclick = () => {
		dialog.close();
	};


	dialog.appendChild(editor);
	dialog.appendChild(submitButton);

	return {};
};

export default createEditorDialog;
