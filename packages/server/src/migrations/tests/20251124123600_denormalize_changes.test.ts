import { ChangeType, ItemType } from '../../services/database/types';
import { shareFolderWithUser } from '../../utils/testing/shareApiUtils';
import { beforeAllDb, afterAllTests, beforeEachDb, db, createUserAndSession } from '../../utils/testing/testUtils';
import { up } from '../20251124123600_denormalize_changes';

describe('20251124123600_denormalize_changes', () => {

	beforeAll(async () => {
		await beforeAllDb('20251124123600_denormalize_changes');
	});

	afterAll(async () => {
		await afterAllTests();
	});

	beforeEach(async () => {
		await beforeEachDb();
	});

	test('should create one update per user', async () => {
		const { session: session1 } = await createUserAndSession(1);
		const { session: session2 } = await createUserAndSession(2);

		const { share } = await shareFolderWithUser(session1.id, session2.id, '000000000000000000000000000000F1', {
			'000000000000000000000000000000F1': {
				'00000000000000000000000000000001': null,
			},
		});

		await db()('changes').truncate();

		// Use db() directly, rather than models().changes.
		// It should be possible to update models().changes
		// to use the new changes_2 API without breaking this test.
		const changeBaseProperties = {
			type: ChangeType.Update,
			item_id: '1234567890',
			item_name: 'some name here',

			updated_time: 1234,
			created_time: 1234,
		};
		await db()('changes').insert([
			{
				id: 'aaaaaaaaaaaaaaaaaaaa',
				counter: 1,
				item_type: ItemType.UserItem,
				previous_item: JSON.stringify({ 'jop_share_id': share.id }),
				user_id: session1.user_id,

				...changeBaseProperties,
			},
		]);

		await up(db());

		const updatedChanges = await db()('changes_2').select('*').orderBy('counter');
		// Should have the correct base properties:
		expect(updatedChanges).toMatchObject([
			{
				counter: 1,
				previous_share_id: share.id,
				...changeBaseProperties,
			},
			{
				counter: 2,
				previous_share_id: share.id,
				...changeBaseProperties,
			},
		]);

		// Should have the correct user_ids.
		const finalUserIds = updatedChanges.map(change => change.user_id);
		finalUserIds.sort();
		expect(finalUserIds).toEqual([session1.user_id, session2.user_id].sort());
	});

});
