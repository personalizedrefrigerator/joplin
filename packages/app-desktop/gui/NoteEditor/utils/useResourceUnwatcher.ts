import ResourceEditWatcher from '@joplin/lib/services/ResourceEditWatcher';
import { useEffect, useRef } from 'react';

interface Props {
	noteId: string;
	windowId: string;
}

const useResourceUnwatcher = ({ noteId, windowId }: Props) => {
	const prevNoteIdRef = useRef(noteId);
	useEffect(() => {
		if (prevNoteIdRef.current === noteId) {
			return;
		}

		void ResourceEditWatcher.instance().stopWatchingAll(windowId);
		prevNoteIdRef.current = noteId;
	}, [noteId, windowId]);
};

export default useResourceUnwatcher;
