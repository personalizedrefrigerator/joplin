import Logger from '@joplin/utils/Logger';
import { Models } from '../../models/factory';
import { writeFile } from 'fs/promises';
import { getRootDir } from '@joplin/utils';
import { join } from 'path';
import { ShareType, Uuid } from '../../services/database/types';

const logger = Logger.create('benchmarkDeltaPerformance');

const computeAverage = (data: number[]) => {
	const total = data.reduce((a, b) => a + b, 0);
	return total / (data.length || 1);
};

const computeStandardDeviation = (data: number[]) => {
	const average = computeAverage(data);
	// Variance(X) = average square distance from the mean
	//             = average((x - average(X))^2 : for all (x in X))
	const variance = computeAverage(data.map((x) => Math.pow(x - average, 2)));
	const standardDeviation = Math.sqrt(variance);
	return standardDeviation;
};

const computeStatistics = (data: number[]) => {
	return { average: computeAverage(data), standardDeviation: computeStandardDeviation(data) };
};

const benchmarkDeltaPerformance = async (models: Models) => {
	let page = 1;
	let done = false;
	const nextUsers = async () => {
		const items = await models.user().allPaginated({ page: page++, limit: 500 });
		done = !items.has_more;
		return items.items;
	};

	const results = [];
	const fullDeltaTimeByUser = new Map<Uuid, number[]>();
	const changesQueryTimeByUser = new Map<Uuid, number[]>();
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

				const times = fullDeltaTimeByUser.get(user.id);
				if (times) {
					times.push(time);
				} else {
					fullDeltaTimeByUser.set(user.id, [time]);
				}
			}

			// Also test the performance of just the changes query, without the
			// postprocessing overhead:
			for (const user of users) {
				const before = performance.now();
				await models.change().changesForUserQuery(user.id, -1, 1000, false);
				const after = performance.now();

				const time = after - before;
				const times = changesQueryTimeByUser.get(user.id);
				if (times) {
					times.push(time);
				} else {
					changesQueryTimeByUser.set(user.id, [time]);
				}
			}
		}

		for (const user of users) {
			const fullTimeStatistics = computeStatistics(fullDeltaTimeByUser.get(user.id) ?? []);
			const changesQueryOnlyStatistics = computeStatistics(changesQueryTimeByUser.get(user.id) ?? []);

			const userItemCount = await models.userItem().countWithUserId(user.id);
			const shareCount = (await models.share().byUserId(user.id, ShareType.Folder)).length;

			results.push({
				'User ID': user.id,
				'Share count': shareCount,
				'user_items count': userItemCount,
				'Total item size': user.total_item_size,
				'Average: full delta time (ms)': fullTimeStatistics.average,
				'Standard deviation: full delta time (ms)': fullTimeStatistics.standardDeviation,
				'Average: changes query time (ms)': changesQueryOnlyStatistics.average,
				'Standard deviation: changes query time (ms)': changesQueryOnlyStatistics.standardDeviation,
			});
			logger.info('Delta performance: User', user.id, ': avg delta time', fullTimeStatistics.average, 'ms, user item count', userItemCount);
		}
	}

	if (results.length === 0) {
		throw new Error('No data collected. Are there users associated with the current server?');
	}

	const serverDir = `${await getRootDir()}/packages/server`;
	const lines = [
		Object.keys(results[0]).join(','),
		...results.map(result => Object.values(result).join(',')),
	];
	const resultCsv = lines.join('\n');
	await writeFile(join(serverDir, 'delta-perf.csv'), resultCsv);
	logger.info('Done');
};

export default benchmarkDeltaPerformance;
