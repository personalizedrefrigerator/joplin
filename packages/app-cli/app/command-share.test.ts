import { setupDatabaseAndSynchronizer, switchClient } from '@joplin/lib/testing/test-utils';
import mockShareService from '@joplin/lib/testing/share/mockShareService';
import { setupCommandForTesting, setupApplication } from './utils/testUtils';
import Folder from '@joplin/lib/models/Folder';
import ShareService from '@joplin/lib/services/share/ShareService';
import BaseItem from '@joplin/lib/models/BaseItem';
import { ModelType } from '@joplin/lib/BaseModel';
const Command = require('./command-share');

const setUpCommand = () => {
	const command = setupCommandForTesting(Command);
	return { command };
};


describe('command-share', () => {
	beforeEach(async () => {
		await setupDatabaseAndSynchronizer(1);
		await switchClient(1);
		await setupApplication();
		BaseItem.shareService_ = ShareService.instance();
	});

	it('should allow sharing a folder with another user', async () => {
		const folder = await Folder.save({ title: 'folder1' });

		const shareId = 'test-id';
		let lastShareUserUpdate: unknown|null = null;
		mockShareService({
			getShareInvitations: async () => ({ items: [] }),
			getShares: async () => {
				const isShared = !!lastShareUserUpdate;
				if (isShared) {
					return {
						items: [{ id: shareId, type: ModelType.Folder, folder_id: folder.id }],
					};
				} else {
					return { items: [] };
				}
			},
			getShareUsers: async (_id: string) => ({ items: [] }),
			// Called when a new user is added to a share
			postShareUsers: async (_id, body) => {
				lastShareUserUpdate = body;
			},
			postShares: async () => ({ id: shareId }),
		}, ShareService.instance());

		const { command } = setUpCommand();
		await command.action({
			'notebook': 'folder1',
			'user': 'test@localhost',
			options: {},
		});

		expect(lastShareUserUpdate).toMatchObject({
			email: 'test@localhost',
			can_write: 1,
			can_read: 1,
		});
	});
});

