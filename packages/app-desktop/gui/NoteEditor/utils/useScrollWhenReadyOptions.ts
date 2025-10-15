import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { NoteBodyEditorRef, ScrollOptions, ScrollOptionTypes } from './types';
import usePrevious from '@joplin/lib/hooks/usePrevious';
import type { NoteIdToScrollPercent } from '../../../app.reducer';

interface Props {
	noteId: string;
	selectedNoteHash: string;
	lastEditorScrollPercents: NoteIdToScrollPercent;
	editorRef: RefObject<NoteBodyEditorRef>;
}

const useScrollWhenReadyOptions = ({ noteId, selectedNoteHash, lastEditorScrollPercents, editorRef }: Props) => {
	const [scrollWhenReady, setScrollWhenReady] = useState<ScrollOptions|null>(null);

	const previousNoteId = usePrevious(noteId);
	const lastScrollPercentsRef = useRef<NoteIdToScrollPercent>(null);
	lastScrollPercentsRef.current = lastEditorScrollPercents;

	useEffect(() => {
		if (noteId === previousNoteId) return;

		if (editorRef.current) {
			editorRef.current.resetScroll();
		}

		const lastScrollPercent = lastScrollPercentsRef.current[noteId] || 0;
		setScrollWhenReady({
			type: selectedNoteHash ? ScrollOptionTypes.Hash : ScrollOptionTypes.Percent,
			value: selectedNoteHash ? selectedNoteHash : lastScrollPercent,
		});
	}, [noteId, previousNoteId, selectedNoteHash, editorRef]);

	const clearScrollWhenReady = useCallback(() => {
		setScrollWhenReady(null);
	}, []);

	return { scrollWhenReady, clearScrollWhenReady };
};

export default useScrollWhenReadyOptions;
