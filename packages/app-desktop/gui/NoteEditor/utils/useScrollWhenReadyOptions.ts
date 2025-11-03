import { RefObject, useCallback, useContext, useRef } from 'react';
import { NoteBodyEditorRef, ScrollOptions, ScrollOptionTypes } from './types';
import usePrevious from '@joplin/lib/hooks/usePrevious';
import NotePositionService from '@joplin/lib/services/NotePositionService';
import useNowEffect from '@joplin/lib/hooks/useNowEffect';
import { WindowIdContext } from '../../NewWindowOrIFrame';

interface Props {
	noteId: string;
	editorName: string;
	selectedNoteHash: string;
	editorRef: RefObject<NoteBodyEditorRef>;
}

const useScrollWhenReadyOptions = ({ noteId, editorName, selectedNoteHash, editorRef }: Props) => {
	const scrollWhenReadyRef = useRef<ScrollOptions|null>(null);

	const previousNoteId = usePrevious(noteId);
	const noteIdChanged = noteId !== previousNoteId;
	const previousEditor = usePrevious(editorName);
	const editorChanged = editorName !== previousEditor;
	const windowId = useContext(WindowIdContext);


	// This needs to be a nowEffect to prevent race conditions
	useNowEffect(() => {
		if (!editorChanged && !noteIdChanged) return () => {};

		if (editorRef.current) {
			editorRef.current.resetScroll();
		}

		const lastScrollPercent = NotePositionService.instance().getScrollPercent(noteId, windowId) || 0;
		scrollWhenReadyRef.current = {
			type: selectedNoteHash ? ScrollOptionTypes.Hash : ScrollOptionTypes.Percent,
			value: selectedNoteHash ? selectedNoteHash : lastScrollPercent,
		};
		return () => {};
	}, [editorChanged, noteIdChanged, noteId, selectedNoteHash, editorRef, windowId]);

	const clearScrollWhenReady = useCallback(() => {
		scrollWhenReadyRef.current = null;
	}, []);

	return { scrollWhenReadyRef, clearScrollWhenReady };
};

export default useScrollWhenReadyOptions;
