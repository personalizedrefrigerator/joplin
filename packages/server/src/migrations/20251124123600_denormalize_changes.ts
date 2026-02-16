import { DbConnection, isPostgres } from '../db';

export const up = async (db: DbConnection) => {
	await db.schema.alterTable('changes', (table) => {
		table.string('share_id', 32).defaultTo('');
		table.unique(['share_id', 'counter']);
	});

	const previousShareIdSql = `
		CASE WHEN changes.previous_item=''
			THEN ''
			ELSE COALESCE(${isPostgres(db) ? '"changes"."previous_item"::json' : 'changes.previous_item'} ->> 'jop_share_id', '')
		END
	`;
	await db('changes').update({
		// Populating share_id from previous_item won't be accurate in the case where an item
		// is moved between shares. However,
		// - The share maintenance task creates Create/Delete changes when an item is moved
		//   between shares. If an Update change doesn't appear in a particular user's delta
		//   results due to an outdated share_id, the Create/Delete changes should ensure that
		//   the item will be updated locally.
		// - After this migration, the share maintenance task will only process changes from
		//   **prior** to the migration (TO-DO!). Newer changes don't require maintenance task.
		share_id: db.raw(previousShareIdSql),
	});

	await db.schema.alterTable('changes', (table) => {
		table.dropColumn('previous_item');
	});

	// TODO: Store the migration index, to be used by the share maintenance task (for determining
	// the last change to be processed by the task).
};

export const down = async (db: DbConnection) => {
	await db.schema.alterTable('changes', (table) => {
		table.text('previous_item').defaultTo('').notNullable();
	});
	await db('changes').update({
		previous_item: db.raw(`json_object('share_id' VALUE share_id)`),
	});
	await db.schema.alterTable('changes', (table) => {
		table.dropColumn('share_id');
	});
};
