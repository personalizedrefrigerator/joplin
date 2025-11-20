import { beforeAllDb, afterAllTests, beforeEachDb, models } from '../utils/testing/testUtils';
import { BackupItem, BackupItemType } from '../services/database/types';
import { Day } from '../utils/time';

describe('BackupItemModel', () => {

	beforeAll(async () => {
		await beforeAllDb('BackupItemModel');
		jest.useFakeTimers({ advanceTimers: true });
	});

	afterAll(async () => {
		await afterAllTests();
	});

	beforeEach(async () => {
		await beforeEachDb();
	});

	test('should delete archived account backups older than 90 days', async () => {
		const backupModel = models().backupItem();

		// Items older than 90 days
		await backupModel.add(BackupItemType.UserAccount, 'key1', 'value');
		await backupModel.add(BackupItemType.UserAccount, 'key2', 'value');
		jest.advanceTimersByTime(30 * Day);
		// Items newer than 90 days
		await backupModel.add(BackupItemType.UserAccount, 'key3', 'value');
		jest.advanceTimersByTime(61 * Day);
		await backupModel.add(BackupItemType.UserAccount, 'key4', 'value');

		const toKeys = (items: BackupItem[]) => items.map(item => item.key);
		expect(
			toKeys(await backupModel.all()).sort(),
		).toEqual(['key1', 'key2', 'key3', 'key4']);

		await backupModel.deleteOldAccountBackups();

		expect(
			toKeys(await backupModel.all()).sort(),
		).toEqual(['key3', 'key4']);
	});

});
