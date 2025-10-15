import { useMemo } from 'react';
import { EditorCursorLocations, NoteToEditorCursorLocations } from '../../../app.reducer';

interface Props {
	lastEditorCursorLocations: NoteToEditorCursorLocations;
	noteId: string;
}

const useInitialCursorLocation = ({ noteId, lastEditorCursorLocations }: Props) => {
	const lastCursorLocation = lastEditorCursorLocations[noteId];

	return useMemo((): EditorCursorLocations => {
		return lastCursorLocation ?? { };
	}, [lastCursorLocation]);
};

export default useInitialCursorLocation;
