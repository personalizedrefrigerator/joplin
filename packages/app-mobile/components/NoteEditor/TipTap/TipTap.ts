/* eslint-disable import/prefer-default-export */

// This contains the CodeMirror instance, which needs to be built into a bundle
// using `yarn buildInjectedJs`. This bundle is then loaded from
// NoteEditor.tsx into the webview.
//
// In general, since this file is harder to debug due to the intermediate built
// step, it's better to keep it as light as possible - it should just be a light
// wrapper to access CodeMirror functionalities. Anything else should be done
// from NoteEditor.tsx.

import { EditorControl, EditorSettings } from '@joplin/editor/types';
import createEditor from '@joplin/editor/TipTap/createEditor';
import WebViewToRNMessenger from '../../../utils/ipc/WebViewToRNMessenger';
import { WebViewToEditorApi } from '../types';


export const initializeEditor = (
	parentElement: HTMLElement,
	initialText: string,
	initialNoteId: string,
	settings: EditorSettings,
): EditorControl => {
	const messenger = new WebViewToRNMessenger<EditorControl, WebViewToEditorApi>('editor', null);

	const control = createEditor(parentElement, {
		initialText,
		initialNoteId,
		settings,

		onPasteFile: async (_data) => {
			throw new Error('Not implemented');
		},

		onLogMessage: message => {
			void messenger.remoteApi.logMessage(message);
		},
		onEvent: (event): void => {
			void messenger.remoteApi.onEditorEvent(event);
		},
	});

	messenger.setLocalInterface(control);
	return control;
};
