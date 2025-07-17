import { EditorEvent } from '@joplin/editor/events';
import { EditorControl, EditorSettings as EditorBodySettings } from '@joplin/editor/types';

export interface EditorProcessApi {
	editor: EditorControl;
}

export interface EditorSettings extends EditorBodySettings {
	themeId: number;
}

export interface SelectionRange {
	start: number;
	end: number;
}

export interface EditorProps {
	parentElementClassName: string;
	initialText: string;
	initialNoteId: string;
	settings: EditorSettings;
}

export interface MainProcessApi {
	onEditorEvent(event: EditorEvent): Promise<void>;
	logMessage(message: string): Promise<void>;
	onPasteFile(type: string, dataBase64: string): Promise<void>;
}
