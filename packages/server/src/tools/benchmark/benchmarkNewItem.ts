import uuid from '@joplin/lib/uuid';
import { Models } from '../../models/factory';
import { ShareUserStatus } from '../../services/database/types';
import { makeNoteSerializedBody } from '../../utils/testing/serializedItems';
import recordBenchmark from './recordBenchmark';
import { ErrorForbidden } from '../../utils/errors';
import config from '../../config';
import { Env } from '../../utils/types';

const benchmarkNewItem = async (models: Models) => {
	// This task creates new notes for users in the database. It should not
	// run with a production database.
	if (config().env !== Env.Dev) throw new ErrorForbidden();

	const iterateItems = async function*() {
		let page = 1;
		let hasMore = true;
		const pageLimit = 10;
		while (hasMore && page < pageLimit) {
			const batchSize = 100;
			const items = await models.share().allPaginated({ page: page++, limit: batchSize });
			hasMore = items.has_more;

			const shares = items.items;
			yield await Promise.all(shares.map(async share => {
				const owner = await models.user().load(share.owner_id);
				const participants = await models.shareUser().byShareId(share.id, ShareUserStatus.Accepted);

				return {
					labels: {
						'Owner ID': owner.id,
						'Participant count': participants.length + 1,
					},
					data: {
						user: owner,
						item: makeNoteSerializedBody({
							title: 'Test note',
							body: 'This is a test note created by `benchmarkNewItem`.',
							parent_id: share.folder_id,
							share_id: share.id,
						}),
					},
				};
			}));
		}
	};

	await recordBenchmark({
		taskLabel: 'item creation',
		batchIterator: iterateItems(),
		trialCount: 5,
		outputFile: 'save-item.csv',
		runTask: async ({ user, item }) => {
			await models.item().saveFromRawContent(user, {
				name: `${uuid.create()}.md`,
				body: Buffer.from(item),
			});
		},
	});
};

export default benchmarkNewItem;
