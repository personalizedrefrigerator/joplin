import { join } from 'path';
import BaseItem from '../../../models/BaseItem';
import Note from '../../../models/Note';
import Resource from '../../../models/Resource';
import shim from '../../../shim';
import { resourceService, setupDatabaseAndSynchronizer, supportDir, switchClient } from '../../../testing/test-utils';
import handleConflictAction from './handleConflictAction';
import { SyncAction } from './types';
import NoteResource from '../../../models/NoteResource';

describe('handleConflictAction', () => {

	beforeEach(async () => {
		await setupDatabaseAndSynchronizer(1);
		await switchClient(1);
	});

	test('note conflict is created', async () => {
		const local = await Note.save({ title: 'Test', body: 'body' });
		// Pass the local note with unsaved changes to verify that the note is reloaded before creating the conflict
		const changedLocal = { ...local, title: 'TestChanged' };
		const remoteContent = { ...local, title: 'TestRemote' };
		const initialSyncItem = await BaseItem.syncItem(1, local.id);

		await handleConflictAction(
			SyncAction.NoteConflict,
			Note,
			true,
			remoteContent,
			changedLocal,
			1,
			false,
			(action) => (action),
		);

		const createdSyncItem = await BaseItem.syncItem(1, local.id);
		const updatedLocal = await Note.load(local.id);
		const notes = await Note.all();
		const conflictNote = await Note.loadByTitle('Test');

		expect(initialSyncItem).toBeUndefined();
		expect(createdSyncItem).toBeDefined();
		expect(updatedLocal.title).toBe('TestRemote');
		expect(notes.length).toBe(2);
		expect(conflictNote.id).not.toBe(local.id);
	});

	test('note conflict is not created when remote and local contents match', async () => {
		const local = await Note.save({ title: 'Test', body: 'body' });
		// Pass the local note with unsaved changes to verify that the note is reloaded before checking if eligible to create a conflict
		const changedLocal = { ...local, title: 'TestChanged' };
		const remoteContent = local;
		const initialSyncItem = await BaseItem.syncItem(1, local.id);

		await handleConflictAction(
			SyncAction.NoteConflict,
			Note,
			true,
			remoteContent,
			changedLocal,
			1,
			false,
			(action) => (action),
		);

		const createdSyncItem = await BaseItem.syncItem(1, local.id);
		const notes = await Note.all();
		expect(initialSyncItem).toBeUndefined();
		expect(createdSyncItem).toBeDefined();
		expect(notes.length).toBe(1);
	});

	test.each([
		{
			label: 'local resource should be deleted if the remote is deleted and not linked to notes',
			linkedToNote: false,
			shouldDelete: true,
		},
		{
			label: 'local resource should be kept if the remote is deleted, but linked to notes',
			linkedToNote: true,
			shouldDelete: false,
		},
	])('$label', async ({ linkedToNote, shouldDelete }) => {
		const noteBody = await shim.attachFileToNoteBody('', join(supportDir, 'photo.jpg'), 0, {});
		const resourceId = (await Note.linkedResourceIds(noteBody))[0];
		if (linkedToNote) {
			const note = await Note.save({ title: 'Test', parent_id: '', body: noteBody });

			// Attachment state should be up-to-date:
			await resourceService().indexNoteResources();
			expect(await NoteResource.associatedNoteIds(resourceId)).toEqual([note.id]);
		}

		const resource = await Resource.load(resourceId);

		await handleConflictAction(
			SyncAction.ResourceConflict,
			Resource,
			false,
			null,
			resource,
			1,
			false,
			(action) => (action),
		);

		const resources = await Resource.all();
		if (shouldDelete) {
			expect(resources).toHaveLength(0);
		} else {
			expect(resources).toHaveLength(1);
		}
	});
});
