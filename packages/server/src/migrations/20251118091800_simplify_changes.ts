import { DbConnection, isPostgres } from '../db';


export const up = async (db: DbConnection) => {
	await db.schema.alterTable('changes', table => {
		table.string('previous_share_id', 32).defaultTo('').notNullable();
		table.index('previous_share_id', 'share_id_change_index');
	});

	// In PostgreSQL, previous_item needs to be cast to JSON. SQLite doesn't recognise the cast
	// operator.
	const previousItemAsJsonSelector = isPostgres(db) ? '"previous_item"::json' : '"previous_item"';
	await db('changes')
		.whereNot('previous_item', '=', '')
		.update({
			// Use "COALESCE" to handle the case where there's no jop_share_id in previous_item.
			previous_share_id: db.raw(`COALESCE(${previousItemAsJsonSelector} ->> 'jop_share_id', '')`),
		});

	await db.schema.alterTable('changes', table => {
		table.dropColumn('previous_item');
	});

	await db.schema.alterTable('shares', table => {
		table.index('owner_id', 'owner_id_index');
	});
};

export const down = async (db: DbConnection) => {
	await db.schema.alterTable('changes', table => {
		table.text('previous_item').defaultTo('').notNullable();
	});

	const previousItemUpdate = db.raw(`${
		isPostgres(db) ? 'json_build_object' : 'json_object'
	}('jop_share_id', "previous_share_id")`);
	await db('changes')
		.whereNot('previous_share_id', '=', '')
		.update({
			previous_item: previousItemUpdate,
		});

	await db.schema.alterTable('changes', table => {
		table.dropIndex('previous_share_id', 'share_id_change_index');
		table.dropColumn('previous_share_id');
	});

	await db.schema.alterTable('shares', table => {
		table.dropIndex('owner_id', 'owner_id_index');
	});
};
