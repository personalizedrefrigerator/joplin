import { setupDatabaseAndSynchronizer, switchClient, synchronizer, synchronizerStart } from '@joplin/lib/testing/test-utils';
import mockShareServiceForFolderSharing from '@joplin/lib/testing/share/mockShareServiceForFolderSharing';
import { setupCommandForTesting, setupApplication } from './utils/testUtils';
import Folder from '@joplin/lib/models/Folder';
import ShareService from '@joplin/lib/services/share/ShareService';
import BaseItem from '@joplin/lib/models/BaseItem';
import { ShareUserStatus, StateShare } from '@joplin/lib/services/share/reducer';
import { ModelType } from '@joplin/lib/BaseModel';
const Command = require('./command-share');

const setUpCommand = () => {
	const output: string[] = [];
	const stdout = (content: string) => {
		output.push(...content.split('\n'));
	};

	const command = setupCommandForTesting(Command, stdout);
	return { command, output };
};

const shareId = 'test-id';
const defaultFolderShare: StateShare = {
	id: shareId,
	type: ModelType.Folder,
	folder_id: 'some-folder-id-here',
	note_id: undefined,
	master_key_id: undefined,
	user: {
		full_name: 'Test user',
		email: 'test@localhost',
		id: 'some-user-id',
	},
};

describe('command-share', () => {
	beforeEach(async () => {
		await setupDatabaseAndSynchronizer(0);
		await switchClient(0);
		await setupDatabaseAndSynchronizer(1);
		await switchClient(1);
		await setupApplication();
		BaseItem.shareService_ = ShareService.instance();
		synchronizer(0).setShareService(ShareService.instance());
		synchronizer(1).setShareService(ShareService.instance());
	});

	test('should allow adding a user to a share', async () => {
		mockShareServiceForFolderSharing({
			clientInfo: [
				{ email: 'test@localhost' },
				{ email: 'test2@localhost' },
			],
			service: ShareService.instance(),
		});

		await switchClient(0);

		const { id: folderId } = await Folder.save({ title: 'folder1' });
		const { command } = setUpCommand();

		// Should share read-write by default
		await command.action({
			'command': 'add',
			'notebook': 'folder1',
			'user': 'test2@localhost',
			options: {},
		});

		await synchronizerStart();

		expect(await Folder.load(folderId)).toMatchObject({ is_shared: 1 });

		await switchClient(1);

		const service = ShareService.instance();
		await service.refreshShareInvitations();
		expect(service.shareInvitations).toMatchObject([{
			email: 'test@localhost',
			can_write: 1,
			can_read: 1,
		}]);

		await switchClient(0);

		// Should also support sharing as read only
		await command.action({
			'command': 'add',
			'notebook': 'folder1',
			'user': 'test2@localhost',
			options: {
				'read-only': true,
			},
		});

		await service.refreshShareInvitations();
		expect(service.shareInvitations).toMatchObject([{
			email: 'test2@localhost',
			can_write: 0,
			can_read: 1,
		}]);
	});

	test.each([
		{
			label: 'should list a single pending invitation',
			invitations: [{ id: 'test', status: ShareUserStatus.Waiting }],
			expectedOutput: [
				'Incoming shares:',
				'\tWaiting: Notebook some-folder-id-here from test@localhost',
				'All shared folders:',
				'\tNone',
			].join('\n'),
		},
		{
			label: 'should list accepted invitations for non-existent folders with [None] as the folder title',
			invitations: [
				{ id: 'test2', status: ShareUserStatus.Accepted },
			],
			expectedOutput: [
				'Incoming shares:',
				'\tAccepted: Notebook [None] from test@localhost',
				'All shared folders:',
				'\tNone',
			].join('\n'),
		},
		{
			label: 'should not list rejected shares',
			invitations: [
				{ id: 'test3', status: ShareUserStatus.Rejected },
			],
			expectedOutput: [
				'Incoming shares:',
				'\tNone',
				'All shared folders:',
				'\tNone',
			].join('\n'),
		},
	])('share invitations: $label', async ({ invitations, expectedOutput }) => {
		const mock = mockShareServiceForFolderSharing({
			clientInfo: [
				{ email: 'test@localhost' },
				{ email: 'test2@localhost' },
			],
			service: ShareService.instance(),
		});
		for (const invitation of invitations) {
			mock.addShareInvitation({
				share: defaultFolderShare,
				master_key: null,
				can_read: 1,
				can_write: 1,
				...invitation,
			}, 'test2@localhost', 'test@localhost');
		}

		await ShareService.instance().refreshShareInvitations();

		const { command, output } = setUpCommand();
		await command.action({
			'command': 'list',
			options: {},
		});

		expect(output.join('\n')).toBe(expectedOutput);
	});
});

