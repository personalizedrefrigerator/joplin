import uuid from '@joplin/lib/uuid';
import { migrateDown, migrateUntil, migrateUp } from '../../db';
import { beforeAllDb, afterAllTests, beforeEachDb, db } from '../../utils/testing/testUtils';
import { ChangeType, ItemType } from '../../services/database/types';

const defaultProperties = {
	user_id: 'test-user-id',
	item_id: 'test-item-id',
	type: ChangeType.Update,
	item_type: ItemType.Item,
	updated_time: 0,
	created_time: 0,
};

describe('20251118091800_simplify_changes', () => {

	beforeEach(async () => {
		await beforeAllDb('20251118091800_simplify_changes', { autoMigrate: false });
		await beforeEachDb();
		await migrateUntil(db(), '20251118091800_simplify_changes');
	});

	afterEach(async () => {
		await afterAllTests();
	});

	test.each([
		{ label: 'is empty', previousItem: '', expectedShareId: '' },
		{ label: 'has no shareId', previousItem: '{ "name": "something.md" }', expectedShareId: '' },
		{ label: 'has a shareId', previousItem: '{ "jop_share_id": "a-test-share-id" }', expectedShareId: 'a-test-share-id' },
	])('should handle the case where previous_item $label', async ({ previousItem, expectedShareId }) => {
		const id = uuid.create();
		await db()('changes').insert({
			id,
			...defaultProperties,
			previous_item: previousItem,
		});

		await migrateUp(db());

		const getItem = () => (
			db()('changes')
				.select('*')
				.where('id', '=', id)
				.first()
		);
		expect(await getItem()).toMatchObject({
			id,
			previous_share_id: expectedShareId,
		});

		await migrateDown(db());

		expect(await getItem()).toMatchObject({
			id,
			type: 2,
			previous_item: expectedShareId ? JSON.stringify({ jop_share_id: expectedShareId }) : '',
			user_id: 'test-user-id',
			item_id: 'test-item-id',
		});
	});
});
