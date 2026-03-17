import uuid, { uuidgen } from '@joplin/lib/uuid';
import { Models } from '../../models/factory';
import { ChangeType, ItemType, Share, ShareUserStatus, User } from '../../services/database/types';
import { makeFolderSerializedBody } from '../../utils/testing/serializedItems';
import recordBenchmark from './recordBenchmark';
import { FolderEntity } from '@joplin/lib/services/database/types';
import { strict as assert } from 'node:assert';
import { DbConnection, truncateTables } from '../../db';

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

const benchmarkRecordChange = async (db: DbConnection, models: Models) => {
	const createAndUpdateItem = async (share: Share, owner: User) => {
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
		}, { shareId: share.id });
		const id = Object.values(saveResult)[0].item.id;

		// Update
		for (let i = 0; i < 10; i++) {
			await models.change().save({
				item_id: id,
				item_name: itemName,
				item_type: ItemType.Item,
				previous_item: JSON.stringify({ jop_share_id: share.id }),
				user_id: owner.id,
				type: ChangeType.Update,
			});
		}

		const item = await models.item().load(id);
		if (item.jop_share_id !== share.id) {
			throw new Error(`Incorrect final share ID, ${item.jop_share_id}`);
		}
	};

	const iterateShares = async function*() {
		const doTruncate = true;
		if (doTruncate) {
			await truncateTables(db, ['changes', 'changes_2']);
		}
		const userCount = 10;

		const owner = await createTestUser(models);
		const { share } = await createAndShareFolder(owner, models);
		for (let i = 1; i < userCount; i++) {
			const recipient = await createTestUser(models);
			const shareUser = await models.shareUser().addByEmail(share.id, recipient.email, '');
			await models.shareUser().setStatus(share.id, shareUser.user_id, ShareUserStatus.Accepted);
		}
		assert.equal((await models.share().allShareUserIds(share)).length, userCount);

		const stepSize = 100;
		// Start at 1: The folder is already included in the share
		for (let itemCount = 1; itemCount <= 1_000; itemCount += stepSize) {
			for (let i = 0; i < stepSize; i++) {
				await createAndUpdateItem(share, owner);
			}
			await models.share().updateSharedItems3();

			const items = [];
			for (const limit of [10, 100, 1000, 'all' as const]) {
				items.push({
					labels: {
						'Share ID': share.id,
						'Participant count': userCount,
						'Item count': itemCount,
						'Total change count': await models.change().count(),
						'Limit': limit,
					},
					data: {
						owner: owner,
						limit,
					},
				});
			}
			yield items;
		}
	};

	await recordBenchmark({
		taskLabel: 'full delta',
		batchIterator: iterateShares(),
		trialCount: 100,
		outputFile: 'delta-perf-full-2.csv',
		runTask: async ({ owner, limit }) => {
			if (limit !== 'all') {
				await models.change().delta(owner.id, { cursor: '', limit });
			} else {
				let cursor = '';
				const next = async () => {
					const result = await models.change().delta(owner.id, { cursor, limit: 100 });
					cursor = result.cursor;
					return result.has_more;
				};

				while (await next()) {
					// no-op
				}
			}
		},
	});
};

export default benchmarkRecordChange;
