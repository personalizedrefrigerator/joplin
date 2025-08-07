import { focus } from '@joplin/lib/utils/focusHandler';
import createTextNode from '../../utils/dom/createTextNode';
import { EditorApi } from '../joplinEditorApiPlugin';
import { EditorEventType } from '../../../events';
import { EditorLanguageType } from '../../../types';

interface SourceBlockData {
	start: string;
	content: string;
	end: string;
}

interface Options {
	editorLabel: string|Promise<string>;
	doneLabel: string|Promise<string>;
	block: SourceBlockData;
	editorApi: EditorApi;
	onSave: (newContent: SourceBlockData)=> void;
}

const createEditorDialog = ({ editorApi, doneLabel, block, onSave }: Options) => {
	const dialog = document.createElement('dialog');
	dialog.classList.add('editor-dialog', '-visible');
	document.body.appendChild(dialog);

	dialog.onclose = () => {
		dialog.remove();
	};

	const editor = editorApi.createTextEditor(
		dialog,
		{ ...editorApi.editorSettings, language: EditorLanguageType.Markdown },
		(event) => {
			if (event.kind === EditorEventType.Change) {
				block = {
					...block,
					start: '',
					end: '',
					content: event.value,
				};
				onSave(block);
			}
		},
	);
	editor.updateBody([
		block.start,
		block.content,
		block.end,
	].join(''));

	const submitButton = document.createElement('button');
	submitButton.appendChild(createTextNode(doneLabel));
	submitButton.classList.add('submit');
	submitButton.onclick = () => {
		if (dialog.close) {
			dialog.close();
		} else {
			// .remove the dialog in browsers with limited support for
			// HTMLDialogElement (and in JSDOM).
			dialog.remove();
		}
	};

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
