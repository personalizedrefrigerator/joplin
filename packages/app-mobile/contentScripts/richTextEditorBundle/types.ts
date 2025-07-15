import { EditorEvent } from '@joplin/editor/events';
import { EditorControl, EditorSettings } from '@joplin/editor/types';

export interface EditorProps {
	initialText: string;
	initialNoteId: string;
	parentElementClassName: string;
	settings: EditorSettings;
}

export interface EditorProcessApi {
	editor: EditorControl;
}

export interface MainProcessApi {
	onEditorEvent(event: EditorEvent): Promise<void>;
	logMessage(message: string): Promise<void>;
}

