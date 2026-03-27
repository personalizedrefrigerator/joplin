import config from '../../config';
import { truncateTables } from '../../db';
import ChangeModelOld from '../../models/ChangeModel/ChangeModel.old';
import ChangeModelNew from '../../models/ChangeModel/ChangeModel.new';
import { ChangeType, ItemType } from '../../services/database/types';
import { shareFolderWithUser } from '../../utils/testing/shareApiUtils';
import { afterAllTests, beforeAllDb, beforeEachDb, createUserAndSession, db, dbSlave, models } from '../../utils/testing/testUtils';
import { up } from './regroup_changes';
import { up as splitChangesMigrationUp, down as splitChangesMigrationDown } from '../20260310123600_split_changes';

const oldChangeModel = () => new ChangeModelOld(db(), dbSlave(), models, config());
const newChangeModel = () => new ChangeModelNew(db(), dbSlave(), models, config());

describe('regroup_changes', () => {

	beforeAll(async () => {
		await beforeAllDb('regroup_changes');
	});

	afterAll(async () => {
		await afterAllTests();
	});

	beforeEach(async () => {
		await beforeEachDb();
	});

	it('should combine entries from changes and changes_2', async () => {
		const { session: session1 } = await createUserAndSession(1);
		const { session: session2 } = await createUserAndSession(2);

		const folderId = '000000000000000000000000000000F1';
		const { share } = await shareFolderWithUser(session1.id, session2.id, folderId, {
			[folderId]: {
				'00000000000000000000000000000001': null,
			},
		});

		await truncateTables(db(), ['changes', 'changes_2']);

		const recordTestChange = (newChange: boolean, type: ChangeType) => {
			const changeData = {
				itemId: folderId,
				itemName: 'test.md',
				itemType: ItemType.Item,
				previousItem: { jop_share_id: share.id },
				shareId: share.id,
				sourceUserId: session1.user_id,
				type,
			};

			if (newChange) {
				return models().change().recordChange(changeData);
			} else {
				return oldChangeModel().recordChange(changeData);
			}
		};

		await recordTestChange(false, ChangeType.Create);
		await recordTestChange(false, ChangeType.Update);

		// Run the "split changes" migration to ensure that the changes_2 table
		// starts in the correct place:
		await splitChangesMigrationDown(db());
		await splitChangesMigrationUp(db());

		// This adds two updates: Calling recordChange for the new model
		// creates one update per user.
		await recordTestChange(true, ChangeType.Update);
		await recordTestChange(true, ChangeType.Delete);

		const expectedLegacyChanges = [
			{ type: ChangeType.Create },
			{ type: ChangeType.Update },
		];
		expect(await oldChangeModel().all()).toMatchObject(expectedLegacyChanges);

		const expectedNewChanges = [
			// Sentinel value marking the split between changes and changes_2.
			// (This is an artifact of the changes/changes_2 split).
			{ type: ChangeType.Create, item_name: '' },

			{ type: ChangeType.Update },
			{ type: ChangeType.Update },
			{ type: ChangeType.Delete },
		];
		expect(await newChangeModel().all()).toMatchObject(expectedNewChanges);

		await up(db());

		const migratedChanges = await db()('changes_3').select('*');

		expect(migratedChanges).toMatchObject([
			// Should migrate all legacy changes except updates
			...expectedLegacyChanges.filter(
				change => change.type !== ChangeType.Update,
			),
			// Should migrate all new changes
			...expectedNewChanges,
		]);
	});
});
