import uuid from '@joplin/lib/uuid';
import { DbConnection, truncateTables } from '../../db';
import { Models } from '../../models/factory';
import { Changes2, ChangeType, ItemType } from '../../services/database/types';
import dbuuid from '../../utils/dbuuid';
import recordBenchmark from './recordBenchmark';
import { makeNoteSerializedBody } from '../../utils/testing/serializedItems';

const createTestUser = async (models: Models) => {
	const email = `benchmark-user-${dbuuid()}@example.com`;
	const user = await models.user().save({
		full_name: 'Benchmark user',
		email,
		// cSpell:disable
		password: '$2a$10$/2DMDnrx0PAspJ2DDnW/PO5x5M9H1abfSPsqxlPMhYiXgDi25751u', // Password = 111111
		// cSpell:enable
	});

	return await models.user().load(user.id);
}

const benchmarkDeleteOldChanges = async (models: Models, db: DbConnection) => {
	const iterateChanges = async function*() {
		for (let changeCount = 1; changeCount < 100_000; changeCount += 1_000) {
			await truncateTables(db, ['changes_2']);
			console.log('changes', changeCount)

			const user = await createTestUser(models);
			const itemCount = 20;
			for (let itemIndex = 0; itemIndex < itemCount; itemIndex ++) {
				console.log('item', itemIndex)
				const id = uuid.create();
				const serializedBody = makeNoteSerializedBody({
					id,
					title: `note ${itemIndex}`,
					parent_id: '',
					share_id: '',
				});

				const itemName = `${id}.md`;
				const result = await models.item().saveFromRawContent(user, {
					name: itemName,
					body: Buffer.from(serializedBody),
				});
				if (result[itemName].error) throw result[itemName].error;
				const item = result[itemName].item;

				const oldDate = new Date('2022-02-02').getTime();

				const batchSize = 1_000;
				for (let i = 0; i < changeCount / itemCount; i += batchSize) {
					const changes: Changes2[] = [];
					for (let j = i; j < i + batchSize; j++) {
						changes.push({
							id: uuid.createNano(),
							created_time: oldDate + i + j,
							updated_time: oldDate + i + j,
							item_id: item.id,
							item_type: ItemType.Item,
							type: ChangeType.Update,
							item_name: itemName,
							previous_share_id: '',
							user_id: user.id,
						});
					}
					await db('changes_2').insert(changes);
				}
			}

			yield [{
				labels: {
					'Change count': await models.change().count(),
				},
				data: {},
			}]
		}
	};

	await recordBenchmark({
		taskLabel: 'changes query',
		batchIterator: iterateChanges(),
		trialCount: 2,
		outputFile: 'delete-old-changes-perf.csv',
		runTask: async () => {
			await models.change().compressOldChanges();
		},
	});
};

export default benchmarkDeleteOldChanges;
