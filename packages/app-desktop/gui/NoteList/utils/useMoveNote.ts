import BaseModel from '@joplin/lib/BaseModel';
import Note from '@joplin/lib/models/Note';
import { NoteEntity } from '@joplin/lib/services/database/types';
import { useCallback } from 'react';
import canManuallySortNotes from './canManuallySortNotes';
import { FocusNote } from './useFocusNote';
import { Dispatch } from 'redux';

interface Props {
	notesParentType: string;
	noteSortOrder: string;
	selectedNoteIds: string[];
	selectedFolderId: string;
	selectedSmartFilterId: string;
	uncompletedTodosOnTop: boolean;
	showCompletedTodos: boolean;
	notes: NoteEntity[];
	selectedFolderInTrash: boolean;
	makeItemIndexVisible: (itemIndex: number)=> void;
	focusNote: FocusNote;
	dispatch: Dispatch;
}

const useMoveNote = ({
	notesParentType,
	noteSortOrder,
	selectedNoteIds,
	selectedFolderId,
	selectedSmartFilterId,
	uncompletedTodosOnTop,
	showCompletedTodos,
	notes,
	selectedFolderInTrash,
	makeItemIndexVisible,
	focusNote,
	dispatch,
}: Props) => {
	const moveNote = useCallback((direction: number, inc: number) => {
		if (!canManuallySortNotes({ notesParentType, selectedSmartFilterId, noteSortOrder, selectedFolderInTrash, allowPromptToSwitch: true })) return;

		const noteId = selectedNoteIds[0];
		let targetNoteIndex = BaseModel.modelIndexById(notes, noteId);
		if ((direction === 1)) {
			targetNoteIndex += inc + 1;
		}
		if ((direction === -1)) {
			targetNoteIndex -= inc;
		}
		void Note.insertNotesAt(selectedFolderId, selectedNoteIds, targetNoteIndex, uncompletedTodosOnTop, showCompletedTodos);

		// The note will be moved to the target index, so we need to update the scroll amount to make it visible
		dispatch({
			type: 'NOTE_SELECT',
			id: noteId,
		});

		makeItemIndexVisible(targetNoteIndex);

		focusNote(noteId);
	}, [selectedFolderId, selectedSmartFilterId, noteSortOrder, notes, notesParentType, selectedNoteIds, uncompletedTodosOnTop, showCompletedTodos, selectedFolderInTrash, makeItemIndexVisible, focusNote, dispatch]);

	return moveNote;
};

export default useMoveNote;
