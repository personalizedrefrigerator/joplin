import * as React from 'react';
import { useCallback, DragEventHandler, MutableRefObject, useState, useEffect } from 'react';
import Note from '@joplin/lib/models/Note';
import canManuallySortNotes from './canManuallySortNotes';
import { Size } from '@joplin/utils/types';
import { ItemFlow } from '@joplin/lib/services/plugins/api/noteListType';
import BaseModel from '@joplin/lib/BaseModel';
import { NoteEntity } from '@joplin/lib/services/database/types';

const useDragAndDrop = (
	parentFolderIsReadOnly: boolean,
	selectedNoteIds: string[],
	selectedFolderId: string,
	listRef: MutableRefObject<HTMLDivElement>,
	scrollTop: number,
	itemSize: Size,
	notesParentType: string,
	noteSortOrder: string,
	uncompletedTodosOnTop: boolean,
	showCompletedTodos: boolean,
	flow: ItemFlow,
	itemsPerLine: number,
	selectedFolderInTrash: boolean,
	notes: NoteEntity[]
) => {
	const [dragOverTargetNoteIndex, setDragOverTargetNoteIndex] = useState(null);

	const onGlobalDrop = useCallback(() => {
		setDragOverTargetNoteIndex(null);
	}, []);

	useEffect(() => {
		document.addEventListener('dragend', onGlobalDrop);
		return () => {
			document.removeEventListener('dragend', onGlobalDrop);
		};
	}, [onGlobalDrop]);

	const onDragStart: DragEventHandler = useCallback(event => {
		if (parentFolderIsReadOnly) return false;

		let noteIds = [];

		// Here there is two cases:
		// - If multiple notes are selected, we drag the group
		// - If only one note is selected, we drag the note that was clicked on
		//   (which might be different from the currently selected note)
		if (selectedNoteIds.length >= 2) {
			noteIds = selectedNoteIds;
		} else {
			const clickedNoteId = event.currentTarget.getAttribute('data-id');
			if (clickedNoteId) noteIds.push(clickedNoteId);
		}

		if (!noteIds.length) return false;

		event.dataTransfer.setDragImage(new Image(), 1, 1);
		event.dataTransfer.clearData();
		event.dataTransfer.setData('text/x-jop-note-ids', JSON.stringify(noteIds));
		return true;
	}, [parentFolderIsReadOnly, selectedNoteIds]);


	const dragTargetNoteIndex = useCallback((event: React.DragEvent) => {
		const rect = listRef.current.getBoundingClientRect();
		const lineIndexFloat = (event.clientY - rect.top + scrollTop) / itemSize.height;
		(window as any).testElement ??= (() => {
			const t = document.createElement('div');
			t.style.backgroundColor = 'red';
			t.style.border = '1px solid blue';
			t.style.width = '3px';
			t.style.height = '3px';
			t.style.opacity = '0.4';
			t.style.pointerEvents = 'none';
			t.style.position = 'fixed';
			t.style.left = 'var(--t-left)';
			t.style.top = 'var(--t-top)';
			document.body.appendChild(t);
			return t;
		})();
		document.body.style.setProperty('--t-left', `${event.clientX}px`);
		document.body.style.setProperty('--t-top', `${event.clientY}px`);

		if (flow === ItemFlow.TopToBottom) {
			return Math.abs(Math.round(lineIndexFloat));
		} else {
			const lineIndex = Math.floor(lineIndexFloat);
			const rowIndexFloat = (event.clientX - rect.left) / itemSize.width;
			const rowIndex = Math.round(rowIndexFloat);
			return lineIndex * itemsPerLine + rowIndex;
		}
	}, [listRef, itemSize, scrollTop, flow, itemsPerLine]);

	const onDragOver: DragEventHandler = useCallback(event => {
		if (notesParentType !== 'Folder') return;
		if (selectedFolderInTrash) return;

		const dt = event.dataTransfer;

		if (dt.types.indexOf('text/x-jop-note-ids') >= 0) {
			console.log('dragover');
			event.preventDefault();
			const newIndex = dragTargetNoteIndex(event);
			if (dragOverTargetNoteIndex === newIndex) return;
			setDragOverTargetNoteIndex(newIndex);
		}
	}, [notesParentType, dragTargetNoteIndex, dragOverTargetNoteIndex, selectedFolderInTrash]);

	const onDrop: DragEventHandler = useCallback(async (event) => {
		console.log('drop')
		const dt = event.dataTransfer;
		if (!dt.types.includes('text/x-jop-note-ids')) return;
		console.log('..a');

		// TODO: check that parent type is folder
		if (!canManuallySortNotes(notesParentType, noteSortOrder, selectedFolderInTrash)) return;

		setDragOverTargetNoteIndex(null);

		const targetNoteIndex = dragTargetNoteIndex(event);
		const noteIds: string[] = JSON.parse(dt.getData('text/x-jop-note-ids'));
		const originalNoteIndex = BaseModel.modelIndexById(notes, noteIds[0]);
		console.debug('reorder notes', { originalNoteIndex, targetNoteIndex, noteIds });
		console.debug('reorder notes.. from', (await Note.load(noteIds[0])).order)

		await Note.insertNotesAt(selectedFolderId, noteIds, targetNoteIndex, uncompletedTodosOnTop, showCompletedTodos);
		console.debug('reorder notes.. to', (await Note.load(noteIds[0])).order)
	}, [notesParentType, dragTargetNoteIndex, noteSortOrder, selectedFolderId, uncompletedTodosOnTop, showCompletedTodos, selectedFolderInTrash]);

	return { onDragStart, onDragOver, onDrop, notes, dragOverTargetNoteIndex };
};

export default useDragAndDrop;
