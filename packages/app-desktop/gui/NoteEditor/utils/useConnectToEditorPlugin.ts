import EditorPluginHandler from '@joplin/lib/services/plugins/EditorPluginHandler';
import PluginService from '@joplin/lib/services/plugins/PluginService';
import { useContext, useEffect, useMemo, useRef } from 'react';
import { FormNote } from './types';
import { WindowIdContext } from '../../NewWindowOrIFrame';
import Logger from '@joplin/utils/Logger';
import { PluginEditorViewState, PluginStates } from '@joplin/lib/services/plugins/reducer';
import { ContainerType } from '@joplin/lib/services/plugins/WebviewController';
import useQueuedAsyncEffect from '@joplin/lib/hooks/useQueuedAsyncEffect';

const logger = Logger.create('useEditorPlugin');

interface Props {
	plugins: PluginStates;
	startupPluginsLoaded: boolean;
	formNote: FormNote;
	activeEditorView: PluginEditorViewState;
	setFormNote: (formNote: FormNote)=> void;
	scheduleSaveNote: (formNote: FormNote)=> Promise<void>;
	effectiveNoteId: string;
	shownEditorViewIds: string[];
}

// Connects editor plugins to the current editor (handles editor plugin saving, loading).
const useConnectToEditorPlugin = ({
	plugins, startupPluginsLoaded, setFormNote, formNote, scheduleSaveNote, effectiveNoteId, activeEditorView, shownEditorViewIds,
}: Props) => {
	const formNoteRef = useRef(formNote);
	formNoteRef.current = formNote;

	const lastEditorPluginSaveRef = useRef<FormNote|null>(null);

	const editorPluginHandler = useMemo(() => {
		return new EditorPluginHandler(PluginService.instance(), async newContent => {
			const changed = newContent.body !== formNoteRef.current.body || newContent.id !== formNoteRef.current.id;
			if (!changed) return;

			const differentId = newContent.id !== formNoteRef.current.id;
			const sameIdAsLastSave = newContent.id === lastEditorPluginSaveRef.current?.id;
			// Ensure that the note is being saved with the correct parent_id, title, etc.
			const sourceFormNote = differentId && sameIdAsLastSave ? lastEditorPluginSaveRef.current : formNoteRef.current;
			const newFormNote = {
				...sourceFormNote,
				id: newContent.id,
				body: newContent.body,
				hasChanged: true,
			};

			lastEditorPluginSaveRef.current = newFormNote;
			setFormNote(newFormNote);
			return scheduleSaveNote(newFormNote);
		});
	}, [setFormNote, scheduleSaveNote]);

	const windowId = useContext(WindowIdContext);
	const loadedViewIds = useMemo(() => {
		const viewIds = [];
		for (const plugin of Object.values(plugins)) {
			for (const view of Object.values(plugin.views)) {
				if (view.containerType === ContainerType.Editor && view.parentWindowId === windowId) {
					viewIds.push(view.id);
				}
			}
		}
		return JSON.stringify(viewIds);
	}, [windowId, plugins]);

	useQueuedAsyncEffect(async () => {
		if (!startupPluginsLoaded) return;
		logger.debug('Emitting activation check for views:', loadedViewIds);

		await editorPluginHandler.emitActivationCheck({
			parentWindowId: windowId,
			noteId: effectiveNoteId,
		});
		// It's important to re-run the activation check when the loaded view IDs change.
		// As such, `loadedViewIds` needs to be in the dependencies list:
	}, [windowId, effectiveNoteId, loadedViewIds, editorPluginHandler, startupPluginsLoaded]);

	useEffect(() => {
		if (!activeEditorView) return ()=>{};

		const cleanup = editorPluginHandler.onEditorPluginShown(activeEditorView.id);
		return cleanup;
	}, [activeEditorView, editorPluginHandler]);

	const formNoteBody = formNote.body;
	useEffect(() => {
		if (!startupPluginsLoaded) return;

		editorPluginHandler.emitUpdate({
			noteId: effectiveNoteId,
			newBody: formNoteBody,
		}, shownEditorViewIds);
	}, [effectiveNoteId, formNoteBody, editorPluginHandler, shownEditorViewIds, startupPluginsLoaded]);
};

export default useConnectToEditorPlugin;
