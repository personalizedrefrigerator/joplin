import { EditorSettings } from '../../../types';
import createEditor from '../../../CodeMirror/createEditor';
import { EditorEvent, EditorEventType } from '../../../events';

interface SourceBlockData {
	start: string;
	content: string;
	end: string;
}

interface Options {
	block: SourceBlockData;
	onSave: (newContent: SourceBlockData)=> void;
	settings: EditorSettings;
}

const createEditorDialog = ({ settings, block, onSave }: Options) => {
	const dialog = document.createElement('dialog');
	dialog.classList.add('editor-dialog');
	document.body.appendChild(dialog);
	dialog.showModal();

	dialog.onclose = () => {
		dialog.remove();
	};

	createEditor(dialog, {
		settings,
		initialNoteId: '',
		initialText: [
			block.start,
			block.content,
			block.end,
		].join(''),
		onLocalize: (input)=>input, // TODO
		onPasteFile: null,
		onEvent: (event: EditorEvent) => {
			if (event.kind === EditorEventType.Change) {
				onSave({
					start: '',
					end: '',
					content: event.value,
				});
			}
		},
		onLogMessage: (_message) => {
			// silent
		},
	});

	const submitButton = document.createElement('button');
	submitButton.textContent = 'Done';
	submitButton.onclick = () => {
		dialog.close();
	};
	dialog.appendChild(submitButton);

	return {};
};

export default createEditorDialog;
