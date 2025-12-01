import Logger from '@joplin/utils/Logger';
import { Models } from '../../models/factory';
import { writeFile } from 'fs/promises';
import { getRootDir } from '@joplin/utils';
import { join } from 'path';
import { ShareType, Uuid } from '../../services/database/types';

const logger = Logger.create('benchmarkDeltaPerformance');

const benchmarkDeltaPerformance = async (models: Models) => {
	let page = 1;
	let done = false;
	const nextUsers = async () => {
		const items = await models.user().allPaginated({ page: page++, limit: 500 });
		done = !items.has_more;
		return items.items;
	};

	const results = [];
	const deltaTimeByUser = new Map<Uuid, number[]>();
	while (!done) {
		const users = await nextUsers();
		logger.info('Page', page - 1, '. Preparing to process', users.length, 'users...');

		const trials = 10;
		for (let trial = 0; trial < trials; trial ++) {
			logger.info('Trial', trial);
			for (const user of users) {
				const cursor = '';
				const before = performance.now();
				await models.change().delta(user.id, { cursor, limit: 1000 });
				const time = performance.now() - before;

				const times = deltaTimeByUser.get(user.id);
				if (times) {
					times.push(time);
				} else {
					deltaTimeByUser.set(user.id, [time]);
				}
			}
		}

		for (const user of users) {
			const times = deltaTimeByUser.get(user.id) ?? [];
			const totalTime = times.reduce((a, b) => a + b, 0);
			const averageTime = totalTime / (times.length || 1);
			const userItemCount = await models.userItem().countWithUserId(user.id);
			const shareCount = (await models.share().byUserId(user.id, ShareType.Folder)).length;

			results.push([user.id, shareCount, userItemCount, user.total_item_size, averageTime]);
			logger.info('Delta performance: User', user.id, ': avg delta time', averageTime, 'ms, user item count', userItemCount);
		}
	}

	const serverDir = `${await getRootDir()}/packages/server`;
	const resultCsv = results.map(line => line.join(',')).join('\n');
	await writeFile(join(serverDir, 'delta-perf.csv'), [
		'user.id, share count, user item count, total item size, average delta time (ms)',
		resultCsv,
	].join('\n'));
	logger.info('Done');
};

export default benchmarkDeltaPerformance;
