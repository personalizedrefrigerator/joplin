import { Dispatch } from 'redux';
import Logger from '@joplin/utils/Logger';
import BaseItem from '../../../models/BaseItem';
import ItemChange from '../../../models/ItemChange';
import Note from '../../../models/Note';
import Resource from '../../../models/Resource';
import time from '../../../time';
import { SyncAction, conflictActions } from './types';
import NoteResource from '../../../models/NoteResource';
import { BaseItemEntity, ResourceEntity } from '../../database/types';

const logger = Logger.create('handleConflictAction');

const handleConflictAction = async (
	action: SyncAction,
	ItemClass: typeof BaseItem,
	remoteExists: boolean,
	remoteContent: BaseItemEntity|null,
	local: BaseItemEntity|null,
	syncTargetId: number,
	itemIsReadOnly: boolean,
	dispatch: Dispatch,
) => {
	if (!conflictActions.includes(action)) return;

	logger.debug(`Handling conflict: ${action}`);
	logger.debug('local:', local, 'remoteContent', remoteContent);
	logger.debug('remoteExists:', remoteExists);

	if (action === SyncAction.ItemConflict) {
		// ------------------------------------------------------------------------------
		// For non-note conflicts, we take the remote version (i.e. the version that was
		// synced first) and overwrite the local content.
		// ------------------------------------------------------------------------------

		if (remoteExists) {
			local = remoteContent;

			const syncTimeQueries = BaseItem.updateSyncTimeQueries(syncTargetId, local, time.unixMs(), remoteContent.updated_time);
			await ItemClass.save(local, { autoTimestamp: false, changeSource: ItemChange.SOURCE_SYNC, nextQueries: syncTimeQueries });
		} else {
			// If the item is a folder, avoid deleting child notes and folders, as this could cause massive data loss where this conflict happens unexpectedly
			await ItemClass.delete(local.id, {
				changeSource: ItemChange.SOURCE_SYNC,
				sourceDescription: 'sync: handleConflictAction: non-note conflict',
				trackDeleted: false,
				deleteChildren: false,
			});
		}
	} else if (action === SyncAction.NoteConflict) {
		// Reload the note, to ensure the latest version is used to create the conflict
		local = await Note.load(local.id);

		// ------------------------------------------------------------------------------
		// First find out if the conflict matters. For example, if the conflict is on the title or body
		// we want to preserve all the changes. If it's on todo_completed it doesn't really matter
		// so in this case we just take the remote content.
		// ------------------------------------------------------------------------------

		let mustHandleConflict = true;
		if (!itemIsReadOnly && remoteContent) {
			mustHandleConflict = Note.mustHandleConflict(local, remoteContent);
		}

		// ------------------------------------------------------------------------------
		// Create a duplicate of local note into Conflicts folder
		// (to preserve the user's changes)
		// ------------------------------------------------------------------------------

		if (mustHandleConflict) {
			await Note.createConflictNote(local, ItemChange.SOURCE_SYNC);
		}

		// ------------------------------------------------------------------------------
		// Remote no longer exists (note deleted) so delete local one too
		// ------------------------------------------------------------------------------

		if (!remoteExists) {
			await ItemClass.delete(
				local.id,
				{
					changeSource: ItemChange.SOURCE_SYNC,
					trackDeleted: false,
					sourceDescription: 'sync: handleConflictAction: note conflict',
				},
			);
		}
	} else if (action === SyncAction.ResourceConflict) {
		const localEntity: ResourceEntity = local;
		if (!remoteExists) {
			const associatedNotes = await NoteResource.associatedNoteIds(local.id);
			// Keep the resource if:
			// - The remote no longer exists, but the resource is still linked to notes.
			// - The resource exists locally (downloaded+decrypted).
			//    - TODO: Remove the "decrypted" condition?
			//
			// Otherwise, delete it locally, too.
			// TODO: What if the NoteResource state is out-of-date and the resource is
			// associated with notes but not marked as such? (Can it be?)
			// TODO: What if the linked notes will be deleted later in the sync process?
			if (associatedNotes.length && await Resource.isReady(localEntity)) {
				// The remote item no longer exists: Reset its sync time to 0.
				const remoteSyncTime = 0;
				const syncTimeQueries = BaseItem.updateSyncTimeQueries(syncTargetId, local, time.unixMs(), remoteSyncTime);
				await ItemClass.save(
					local,
					{
						autoTimestamp: false,
						changeSource: ItemChange.SOURCE_SYNC,
						nextQueries: syncTimeQueries,
					},
				);
			} else {
				await ItemClass.delete(
					local.id,
					{
						changeSource: ItemChange.SOURCE_SYNC,
						trackDeleted: false,
						sourceDescription: 'sync: handleConflictAction: resource conflict',
					},
				);
			}
		} else if (!remoteContent || Resource.mustHandleConflict(local, remoteContent)) {
			await Resource.createConflictResourceNote(local);

			if (remoteExists) {
				// The local content we have is no longer valid and should be re-downloaded
				await Resource.setLocalState(local.id, {
					fetch_status: Resource.FETCH_STATUS_IDLE,
				});
			}

			dispatch({ type: 'SYNC_CREATED_OR_UPDATED_RESOURCE', id: local.id });
		}
	}

	if ([SyncAction.NoteConflict, SyncAction.ResourceConflict].includes(action)) {
		// ------------------------------------------------------------------------------
		// For note and resource conflicts, the creation of the conflict item is done
		// differently. However the way the local content is handled is the same.
		// Copy the remote content to local or if the remote still exists.
		// ------------------------------------------------------------------------------

		if (remoteExists) {
			local = remoteContent;
			const syncTimeQueries = BaseItem.updateSyncTimeQueries(syncTargetId, local, time.unixMs(), remoteContent.updated_time);
			await ItemClass.save(local, { autoTimestamp: false, changeSource: ItemChange.SOURCE_SYNC, nextQueries: syncTimeQueries });

			if (local.encryption_applied) dispatch({ type: 'SYNC_GOT_ENCRYPTED_ITEM' });
		}
	}
};

export default handleConflictAction;
