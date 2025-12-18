import { useEffect, useRef, RefObject } from 'react';
import { OnMessage } from '../../../utils/types';
import { EditorControl } from '@joplin/editor/types';

interface Props {
	content: string;

	onMessage: OnMessage;
	editorRef: RefObject<EditorControl>;
	noteId: string;
	initialCursorLocationRef: RefObject<number>;
	lastChangeEventContentRef: RefObject<string>;
}

// Updates the editor's value as necessary
const useSyncEditorValue = ({ content, onMessage, editorRef, noteId, initialCursorLocationRef, lastChangeEventContentRef }: Props) => {
	const onMessageRef = useRef(onMessage);
	onMessageRef.current = onMessage;

	useEffect(() => {
		if (lastChangeEventContentRef.current === content) return;

		editorRef.current?.updateBody(content, { noteId: noteId });
	}, [content, noteId, editorRef, initialCursorLocationRef]);
};

export default useSyncEditorValue;
