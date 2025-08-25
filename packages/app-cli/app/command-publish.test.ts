import ShareService from '@joplin/lib/services/share/ShareService';
import mockShareService from '@joplin/lib/testing/share/mockShareService';
import { setupDatabaseAndSynchronizer, switchClient, waitFor } from '@joplin/lib/testing/test-utils';
import { setupApplication, setupCommandForTesting } from './utils/testUtils';
import Note from '@joplin/lib/models/Note';
import Folder from '@joplin/lib/models/Folder';
import Setting from '@joplin/lib/models/Setting';
const Command = require('./command-publish');


describe('command-publish', () => {
	beforeEach(async () => {
		await setupDatabaseAndSynchronizer(1);
		await switchClient(1);
		await setupApplication();

		mockShareService({
			getShares: async () => {
				return { items: [] };
			},
			postShares: async () => ({ id: 'test-id' }),
			getShareInvitations: async () => null,
		}, ShareService.instance());
	});

	test('should publish a note', async () => {
		const onStdout = jest.fn();
		const command = setupCommandForTesting(Command, onStdout);

		const testFolder = await Folder.save({ title: 'Test' });
		const testNote = await Note.save({ title: 'test', parent_id: testFolder.id });

		await command.action({
			note: testNote.id,
			options: {
				force: true,
			},
		});

		// Should be shared
		await waitFor(async () => {
			expect(await Note.load(testNote.id)).toMatchObject({
				is_shared: 1,
			});
		});
	});

	test('should be enabled for Joplin Server and Cloud sync targets', async () => {
		const command = setupCommandForTesting(Command, ()=>{});

		Setting.setValue('sync.target', 1);
		expect(command.enabled()).toBe(false);

		const supportedSyncTargets = [9, 10, 11];
		for (const id of supportedSyncTargets) {
			Setting.setValue('sync.target', id);
			expect(command.enabled()).toBe(true);
		}
	});
});
