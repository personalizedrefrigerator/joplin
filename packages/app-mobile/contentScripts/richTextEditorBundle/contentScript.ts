import { createEditor } from '@joplin/editor/ProseMirror';
import { EditorProcessApi, EditorProps, MainProcessApi } from './types';
import WebViewToRNMessenger from '../../utils/ipc/WebViewToRNMessenger';

export const initialize = ({
	settings,
	initialText,
	initialNoteId,
	parentElementClassName,
}: EditorProps) => {
	const messenger = new WebViewToRNMessenger<EditorProcessApi, MainProcessApi>('rich-text-editor', null);
	const parentElement = document.getElementsByClassName(parentElementClassName)[0];
	if (!parentElement) throw new Error('Parent element not found');
	if (!(parentElement instanceof HTMLElement)) {
		throw new Error('Parent node is not an element.');
	}

	const editor = createEditor(parentElement, {
		settings,
		initialText,
		initialNoteId,

		onPasteFile: () => {
			throw new Error('Not implemented: onPasteFile');
		},
		onLogMessage: (message: string) => {
			void messenger.remoteApi.logMessage(message);
		},
		onEvent: (event) => {
			void messenger.remoteApi.onEditorEvent(event);
		},
	});

	messenger.setLocalInterface({
		editor,
	});

	return editor;
};

export { default as setUpLogger } from '../utils/setUpLogger';

