import { EditorEvent } from '@joplin/editor/events';
import { EditorControl, EditorSettings, LocalizationResult } from '@joplin/editor/types';

export interface EditorProcessApi {
	editor: EditorControl;
}

export interface SelectionRange {
	start: number;
	end: number;
}

export interface EditorProps {
	parentElementOrClassName: HTMLElement|string;
	initialText: string;
	initialNoteId: string|null;
	settings: EditorSettings;
}

export interface EditorWithParentProps extends EditorProps {
	onEvent: (editorEvent: EditorEvent)=> void;
}

export interface MainProcessApi {
	onLocalize(text: string): LocalizationResult;
	onEditorEvent(event: EditorEvent): Promise<void>;
	logMessage(message: string): Promise<void>;
	onPasteFile(type: string, dataBase64: string): Promise<void>;
}
