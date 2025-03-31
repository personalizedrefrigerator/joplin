import useAsyncEffect from '@joplin/lib/hooks/useAsyncEffect';
import EditorPluginHandler from '@joplin/lib/services/plugins/EditorPluginHandler';
import PluginService from '@joplin/lib/services/plugins/PluginService';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { FormNote } from './types';
import { WindowIdContext } from '../../NewWindowOrIFrame';
import Logger from '@joplin/utils/Logger';
import { PluginEditorViewState } from '@joplin/lib/services/plugins/reducer';

const logger = Logger.create('useEditorPlugin');

interface Props {
	startupPluginsLoaded: boolean;
	formNote: FormNote;
	activeEditorView: PluginEditorViewState;
	setFormNote: (formNote: FormNote)=> void;
	effectiveNoteId: string;
	shownEditorViewIds: string[];
}

// Connects editor plugins to the current editor (handles editor plugin saving, loading).
const useConnectToEditorPlugin = ({
	startupPluginsLoaded, setFormNote, formNote, effectiveNoteId, activeEditorView, shownEditorViewIds,
}: Props) => {
	const formNoteRef = useRef(formNote);
	formNoteRef.current = formNote;

	const lastEditorPluginSaveRef = useRef<FormNote|null>(null);

	const editorPluginHandler = useMemo(() => {
		return new EditorPluginHandler(PluginService.instance(), newContent => {
			const changed = newContent.body !== formNoteRef.current.body || newContent.id !== formNoteRef.current.id;
			if (!changed) return;

			const differentId = newContent.id !== formNoteRef.current.id;
			const sameIdAsLastSave = newContent.id === lastEditorPluginSaveRef.current.id;
			// Ensure that the note is being saved with the correct parent_id, title, etc.
			const sourceFormNote = differentId && sameIdAsLastSave ? lastEditorPluginSaveRef.current : formNoteRef.current;
			const newFormNote = {
				...sourceFormNote,
				id: newContent.id,
				body: newContent.body,
			};

			lastEditorPluginSaveRef.current = newFormNote;
			setFormNote(newFormNote);
		});
	}, [setFormNote]);

	const windowId = useContext(WindowIdContext);

	useAsyncEffect(async (_event) => {
		if (!startupPluginsLoaded) return;
		await editorPluginHandler.emitActivationCheck({
			parentWindowId: windowId,
			noteId: effectiveNoteId,
		});
	}, [windowId, effectiveNoteId, editorPluginHandler, startupPluginsLoaded]);

	const [externalChangeCounter, setExternalChangeCounter] = useState(0);
	useEffect(() => {
		// Use formNoteRef to prevent race conditions.
		if (formNoteRef.current.body !== lastEditorPluginSaveRef.current?.body) {
			setExternalChangeCounter(counter => counter + 1);
		}
	}, [formNote.body]);

	useEffect(() => {
		if (!activeEditorView) return ()=>{};

		const cleanup = editorPluginHandler.onEditorPluginShown(activeEditorView.id, windowId);
		return cleanup;
	}, [activeEditorView, editorPluginHandler, windowId]);

	useEffect(() => {
		if (!startupPluginsLoaded) return;
		if (externalChangeCounter > 0) {
			logger.debug(`Editor content changed externally. Counter: ${externalChangeCounter}`);
		}

		editorPluginHandler.emitUpdate({
			noteId: effectiveNoteId,
			newBody: formNoteRef.current.body,
			windowId: windowId,
		}, shownEditorViewIds);
	}, [windowId, effectiveNoteId, externalChangeCounter, editorPluginHandler, shownEditorViewIds, startupPluginsLoaded]);
};

export default useConnectToEditorPlugin;
