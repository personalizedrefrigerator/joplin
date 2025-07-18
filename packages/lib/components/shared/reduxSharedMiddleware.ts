import Setting from '../../models/Setting';
import Tag from '../../models/Tag';
import BaseModel from '../../BaseModel';
import Note from '../../models/Note';
import { reg } from '../../registry';
import ResourceFetcher from '../../services/ResourceFetcher';
import DecryptionWorker from '../../services/DecryptionWorker';
import eventManager, { EventName } from '../../eventManager';
import BaseItem from '../../models/BaseItem';
import shim from '../../shim';
import { Dispatch } from 'redux';
import { State } from '../../reducer';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
let sortNoteListTimeout: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
export default async (store: any, _next: any, action: any, dispatch: Dispatch) => {
	const newState: State = store.getState();

	eventManager.appStateEmit(newState);

	let refreshTags = false;
	let sortNoteList = false;

	if (action.type === 'FOLDER_SET_COLLAPSED' || action.type === 'FOLDER_TOGGLE') {
		Setting.setValue('collapsedFolderIds', newState.collapsedFolderIds);
	}

	if (action.type === 'SETTING_UPDATE_ONE' && !!action.key.match(/^sync\.\d+\.path$/)) {
		reg.resetSyncTarget();
	}

	let mustAutoAddResources = false;

	if (action.type === 'SETTING_UPDATE_ONE' && action.key === 'sync.resourceDownloadMode') {
		mustAutoAddResources = true;
	}

	if (action.type === 'DECRYPTION_WORKER_SET' && action.state === 'idle' && action.decryptedItemCounts && !!action.decryptedItemCounts[BaseModel.TYPE_NOTE]) {
		mustAutoAddResources = true;
	}

	// In general the DecryptionWorker is started via events, such as when an encrypted note
	// is received via sync, or after an encrypted has been downloaded. However, in some cases,
	// in particular when an item cannot be decrypted, the service won't retry automatically,
	// since it's not useful because the data most likely is corrupted. In some
	// cases the user might want to retry anyway, so we enable this by starting the service
	// automatically after each full sync (which is triggered when the user presses the sync
	// button, but not when a note is saved).
	if (action.type === 'SYNC_COMPLETED' && action.isFullSync) {
		void DecryptionWorker.instance().scheduleStart();
	}

	if (action.type === 'NOTE_DELETE' ||
		action.type === 'NOTE_UPDATE_ALL' ||
		action.type === 'NOTE_TAG_REMOVE' ||
		action.type === 'TAG_UPDATE_ONE') {
		refreshTags = true;
	}

	// handle the case when the selected note has been moved to another
	// folder and a new one is now selected, need to show correct tags for it
	if (action.type === 'NOTE_UPDATE_ONE' && action.changedFields.indexOf('parent_id') >= 0) {
		refreshTags = true;
	}

	if (action.type === 'NOTE_UPDATE_ONE') {
		sortNoteList = true;
	}

	if (action.type === 'NOTE_SELECT' || action.type === 'NAV_BACK') {
		const noteIds = newState.provisionalNoteIds.slice();
		for (const noteId of noteIds) {
			if (action.id === noteId) continue;
			reg.logger().info('Provisional was not modified - deleting it');
			await Note.delete(noteId, { sourceDescription: 'reduxSharedMiddleware: Delete provisional note' });
		}
	}

	if (action.type === 'NOTE_DELETE' ||
		action.type === 'NOTE_SELECT' ||
		action.type === 'NOTE_SELECT_TOGGLE' ||
		action.type === 'TAG_UPDATE_ONE' ||
		action.type === 'TAG_UPDATE_ALL') {
		let noteTags = [];

		// We don't need to show tags unless only one note is selected.
		// For new notes, the old note is still selected, but we don't want to show any tags.
		if (newState.selectedNoteIds &&
			newState.selectedNoteIds.length === 1) {
			noteTags = await Tag.tagsByNoteId(newState.selectedNoteIds[0]);
		}

		store.dispatch({
			type: 'SET_NOTE_TAGS',
			items: noteTags,
		});
	}

	if (mustAutoAddResources) {
		void ResourceFetcher.instance().autoAddResources();
	}

	if (refreshTags) {
		store.dispatch({
			type: 'TAG_UPDATE_ALL',
			items: await Tag.allWithNotes(),
		});
	}

	if (sortNoteList) {
		if (sortNoteListTimeout) shim.clearTimeout(sortNoteListTimeout);
		sortNoteListTimeout = null;

		// We sort the note lists with two seconds debounce because doing can be
		// very slow and would have to be done every time a note is added.
		if (Date.now() - newState.noteListLastSortTime > 10000) {
			dispatch({ type: 'NOTE_SORT' });
		} else {
			sortNoteListTimeout = shim.setTimeout(() => {
				sortNoteListTimeout = null;
				dispatch({ type: 'NOTE_SORT' });
			}, 2000);
		}
	}

	if (action.type.startsWith('SHARE_')) {
		const serialized = JSON.stringify(newState.shareService);
		Setting.setValue('sync.shareCache', serialized);
		BaseItem.syncShareCache = JSON.parse(serialized);
	}

	// For debugging purposes: it seems in some case an empty note is saved to
	// the note array, so in that case display a log statements so that it can
	// be debugged.
	// https://discourse.joplinapp.org/t/how-to-recover-corrupted-database/9367/3?u=laurent
	if (action.type.indexOf('NOTE_') === 0) {
		for (const note of newState.notes) {
			if (!note) {
				reg.logger().error('Detected empty element in note array', action);
			}
		}
	}

	if (action.type === 'WINDOW_OPEN') {
		eventManager.emit(EventName.WindowOpen, {
			windowId: action.windowId,
		});
	} else if (action.type === 'WINDOW_CLOSE') {
		eventManager.emit(EventName.WindowClose, {
			windowId: action.windowId,
		});
	}
};
