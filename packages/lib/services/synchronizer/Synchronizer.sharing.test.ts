import { join } from 'path';
import Folder from '../../models/Folder';
import Note from '../../models/Note';
import shim from '../../shim';
import mockShareServiceForFolderSharing from '../../testing/share/mockShareServiceForFolderSharing';
import { afterAllCleanUp, setupDatabaseAndSynchronizer, supportDir, switchClient, synchronizer, synchronizerStart } from '../../testing/test-utils';
import BaseItem from '../../models/BaseItem';
import Resource from '../../models/Resource';
import ShareService from '../share/ShareService';
import { ModelType } from '../../BaseModel';

let shareService: ShareService;
const createSharedFolderWithResource = async () => {
	await switchClient(0);

	let folder = await Folder.save({ title: 'Test' });
	let note = await Note.save({ title: 'Note 1', parent_id: folder.id });
	note = await shim.attachFileToNote(note, join(supportDir, 'photo.jpg'));

	const share = await shareService.shareFolder(folder.id);
	const invitation = await shareService.addShareRecipient(share.id, '', 'test2@localhost', { can_read: 1, can_write: 1 });

	await synchronizerStart();
	await switchClient(1);

	await shareService.respondInvitation(invitation.id, null, true);

	await synchronizerStart();

	const resource = await Resource.load(Note.linkedItemIds(note.body)[0]);
	folder = await Folder.load(folder.id);
	note = await Note.load(note.id);

	expect(folder).toMatchObject({ title: 'Test' });
	expect(note).toMatchObject({ title: 'Note 1' });
	expect(resource).toMatchObject({ title: 'photo.jpg' });

	return { folder, note, resource };
};

const firstLinkedResourceId = async (noteId: string) => {
	const note = await Note.load(noteId);
	const linkedResources = await Note.linkedItemIdsByType(ModelType.Resource, note.body);
	return linkedResources[0];
};

const firstLinkedResource = async (noteId: string) => {
	return await Resource.load(await firstLinkedResourceId(noteId));
};

describe('Synchronizer.sharing', () => {

	beforeEach(async () => {
		await setupDatabaseAndSynchronizer(0);
		await setupDatabaseAndSynchronizer(1);
		await switchClient(0);

		shareService = mockShareServiceForFolderSharing({
			clientInfo: [
				{ email: 'test@localhost' },
				{ email: 'test2@localhost' },
			],
		}).service;

		BaseItem.shareService_ = shareService;
		Resource.shareService_ = shareService;
		synchronizer(0).setShareService(shareService);
		synchronizer(1).setShareService(shareService);
	});

	afterAll(async () => {
		await afterAllCleanUp();
	});

	it('should duplicate resources that are present in multiple shares on sync', async () => {
		const { note: note1, resource } = await createSharedFolderWithResource();
		const { folder: folder2 } = await createSharedFolderWithResource();

		// Use the same resource in two shares:
		const note2 = await Note.save({ parent_id: folder2.id, body: `![test](:/${resource.id})` });

		await synchronizerStart();

		const resourceInstance1 = await firstLinkedResource(note1.id);
		const resourceInstance2 = await firstLinkedResource(note2.id);
		expect(resourceInstance1.id).not.toBe(resourceInstance2.id);

		// At least one of the two should use the original ID
		expect(resourceInstance1.id === resource.id || resourceInstance2.id === resource.id).toBe(true);
	});

});

// import { afterAllCleanUp, synchronizerStart, setupDatabaseAndSynchronizer, switchClient, joplinServerApi } from '../../testing/test-utils';
// import Note from '../../models/Note';
// import BaseItem from '../../models/BaseItem';
// import shim from '../../shim';
// import Resource from '../../models/Resource';
// import Folder from '../../models/Folder';

// describe('Synchronizer.sharing', function() {

// 	beforeEach(async () => {
// 		await setupDatabaseAndSynchronizer(1);
// 		await switchClient(1);
// 	});

// 	afterAll(async () => {
// 		await afterAllCleanUp();
// 	});

// 	it('should mark link resources as shared before syncing', (async () => {
// 		let note1 = await Note.save({ title: 'note1' });
// 		note1 = await shim.attachFileToNote(note1, `${__dirname}/../tests/support/photo.jpg`);
// 		const resourceId1 = (await Note.linkedResourceIds(note1.body))[0];

// 		const note2 = await Note.save({ title: 'note2' });
// 		await shim.attachFileToNote(note2, `${__dirname}/../tests/support/photo.jpg`);

// 		expect((await Resource.sharedResourceIds()).length).toBe(0);

// 		await BaseItem.updateShareStatus(note1, true);

// 		await synchronizerStart();

// 		const sharedResourceIds = await Resource.sharedResourceIds();
// 		expect(sharedResourceIds.length).toBe(1);
// 		expect(sharedResourceIds[0]).toBe(resourceId1);
// 	}));

// 	it('should share items', (async () => {
// 		await setupDatabaseAndSynchronizer(1, { userEmail: 'user1@example.com' });
// 		await switchClient(1);

// 		const api = joplinServerApi();
// 		await api.exec('POST', 'api/debug', null, { action: 'createTestUsers' });
// 		await api.clearSession();

// 		const folder1 = await Folder.save({ title: 'folder1' });
// 		await Note.save({ title: 'note1', parent_id: folder1.id });

// 		await synchronizerStart();

// 		await setupDatabaseAndSynchronizer(2, { userEmail: 'user2@example.com' });
// 		await switchClient(2);

// 		await synchronizerStart();

// 		await switchClient(1);

// 		console.info(await Note.all());
// 	}));

// });
