import Note from '@joplin/lib/models/Note';
import { FolderEntity, NoteEntity, ResourceEntity } from '@joplin/lib/services/database/types';
import { ResourceInfo } from '../../NoteBodyViewer/hooks/useRerenderHandler';
import { NoteViewerMode } from './types';

export interface State {
	note: NoteEntity;
	mode: NoteViewerMode;
	readOnly: boolean;
	searchVisible: boolean;
	folder: FolderEntity|null;
	lastSavedNote: NoteEntity | null;
	isLoading: boolean;
	titleTextInputHeight: number;
	alarmDialogShown: boolean;
	heightBumpView: number;
	noteTagDialogShown: boolean;
	publishDialogShown: boolean;
	fromShare: boolean;
	showCamera: boolean;
	showImageEditor: boolean;
	showAudioRecorder: boolean;
	imageEditorResource: ResourceEntity;
	imageEditorResourceFilepath: string;
	noteResources: Record<string, ResourceInfo>;
	newAndNoTitleChangeNoteId: boolean|null;
	noteLastLoadTime: number;

	undoRedoButtonState: {
		canUndo: boolean;
		canRedo: boolean;
	};

	showSpeechToTextDialog: boolean;
	multiline: boolean;
	showMultilineToggle: boolean | null;
	titleContainerWidth: number;
}

// Emulates the partial-merge semantics of a class component's setState (accepts either a partial
// state object or an updater function returning one).
export type StateAction = Partial<State> | ((prevState: State)=> Partial<State>);

export const noteScreenStateReducer = (state: State, action: StateAction): State => {
	const partialState = typeof action === 'function' ? action(state) : action;
	return { ...state, ...partialState };
};

export const makeInitialState = (noteVisiblePanes: string[]): State => ({
	note: Note.new(),
	mode: noteVisiblePanes?.includes('editor') ? 'edit' : 'view',
	readOnly: false,
	folder: null,
	lastSavedNote: null,
	isLoading: true,
	titleTextInputHeight: 20,
	alarmDialogShown: false,
	heightBumpView: 0,
	noteTagDialogShown: false,
	publishDialogShown: false,
	fromShare: false,
	showCamera: false,
	showImageEditor: false,
	showAudioRecorder: false,
	searchVisible: false,
	imageEditorResource: null,
	noteResources: {},
	imageEditorResourceFilepath: null,
	newAndNoTitleChangeNoteId: null,
	noteLastLoadTime: Date.now(),

	undoRedoButtonState: {
		canUndo: false,
		canRedo: false,
	},

	showSpeechToTextDialog: false,
	multiline: false,
	showMultilineToggle: null,
	titleContainerWidth: 0,
});
