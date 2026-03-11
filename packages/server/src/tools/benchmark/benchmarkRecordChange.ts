import uuid, { uuidgen } from '@joplin/lib/uuid';
import { Models } from '../../models/factory';
import { ChangeType, ItemType, Share, ShareUserStatus, User } from '../../services/database/types';
import { makeFolderSerializedBody } from '../../utils/testing/serializedItems';
import recordBenchmark from './recordBenchmark';
import { FolderEntity } from '@joplin/lib/services/database/types';
import { strict as assert } from 'node:assert';

const createTestUser = async (models: Models) => {
	const email = `benchmark-${uuidgen()}@example.com`;
	const user = await models.user().save({
		full_name: 'Benchmark user',
		email,
		// cSpell:disable
		password: '$2a$10$/2DMDnrx0PAspJ2DDnW/PO5x5M9H1abfSPsqxlPMhYiXgDi25751u', // Password = 111111
		// cSpell:enable
	});

	return await models.user().load(user.id);
};

const createFolder = async (owner: User, models: Models) => {
	const id = uuid.create();
	const itemName = `${id}.md`;

	const serializedBody = makeFolderSerializedBody({
		id,
		title: 'Test',
	});

	const result = await models.item().saveFromRawContent(owner, {
		name: itemName,
		body: Buffer.from(serializedBody),
	});

	if (result[itemName].error) throw result[itemName].error;
	return result[itemName].item;
};

const createAndShareFolder = async (owner: User, models: Models) => {
	const folder = await createFolder(owner, models);
	const share = await models.share().shareFolder(owner, folder.jop_id, '');

	const folderItem = await models.item().loadAsJoplinItem<FolderEntity>(folder.id);
	const serialized = makeFolderSerializedBody({
		...folderItem,
		share_id: share.id,
	});
	await models.item().saveFromRawContent(owner, {
		name: `${folder.id}.md`,
		body: Buffer.from(serialized),
	});

	return { share, folder };
};

const benchmarkRecordChange = async (models: Models) => {
	type DataPoint = {
		share: Share;
		owner: User;
	};
	const iterateShares = async function*() {
		for (let userCount = 1; userCount <= 200; userCount += 20) {
			const owner = await createTestUser(models);
			const { share } = await createAndShareFolder(owner, models);

			for (let i = 1; i < userCount; i++) {
				const recipient = await createTestUser(models);
				const shareUser = await models.shareUser().addByEmail(share.id, recipient.email, '');
				await models.shareUser().setStatus(share.id, shareUser.user_id, ShareUserStatus.Accepted);
			}
			assert.equal((await models.share().allShareUserIds(share)).length, userCount);

			await models.share().updateSharedItems3();

			yield [{
				labels: {
					'Share ID': share.id,
					'Participant count': userCount,
				},
				data: {
					share,
					owner: owner,
				},
			}];
		}
	};

	await recordBenchmark<DataPoint>({
		taskLabel: 'create->update->delete',
		batchIterator: iterateShares(),
		trialCount: 2,
		outputFile: 'create-update-delete-item-perf.csv',
		runTask: async ({ share, owner }) => {
			const jopId = uuidgen();
			const serializedBody = (title: string) => makeFolderSerializedBody({
				id: jopId,
				title,
				share_id: share.id,
			});
			const itemName = `${jopId}.md`;

			// Create
			const saveResult = await models.item().saveFromRawContent(owner, {
				name: itemName,
				body: Buffer.from(serializedBody('Test 1')),
			});
			const id = Object.values(saveResult)[0].item.id;

			// Update
			for (let i = 0; i < 10; i++) {
				await models.change().recordChange({
					itemId: id,
					itemName: itemName,
					itemType: ItemType.Item,
					previousItem: { jop_share_id: share.id },
					shareId: share.id,
					sourceUserId: owner.id,
					type: ChangeType.Update,
				});
			}
			// Delete
			await models.item().deleteForUser(owner.id, await models.item().load(id));
		},
	});
};

export default benchmarkRecordChange;
