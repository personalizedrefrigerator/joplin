import { strict as assert } from 'assert';
import { DbConnection } from '../db';
import { uuidgen } from '../utils/uuid';

export const up = async (db: DbConnection) => {
	await db.schema.createTable('changes_2', (table) => {
		// In this table, the counter is the primary key, since
		// we want it to be automatically incremented. There's also a
		// column ID to publicly identify a change.
		table.increments('counter').unique().primary().notNullable();
		table.string('id', 32).unique().notNullable();
		table.string('item_id', 32).notNullable();
		table.string('user_id', 32).defaultTo('').notNullable();
		table.text('item_name').defaultTo('').notNullable();
		table.string('previous_share_id', 32).defaultTo('').notNullable();
		table.integer('item_type').notNullable();
		table.integer('type').notNullable();
		table.bigInteger('updated_time').notNullable();
		table.bigInteger('created_time').notNullable();

		// TODO: What is the performance change if the "unique" index is removed here?
		table.index(['user_id', 'counter']);
		table.unique(['user_id', 'counter']);
	});

	// Create a single starting change to ensure that `counter` starts incrementing in
	// the new table from where it left of in the old:
	const lastOldChange = await db('changes').select('counter').orderBy('counter', 'desc').first();
	let startCounter = 0;
	if (lastOldChange) {
		assert.ok(isFinite(lastOldChange.counter));
		startCounter = lastOldChange.counter + 1;
	}

	await db('changes_2').insert({
		counter: startCounter,
		id: uuidgen(),
		item_id: '',
		user_id: '',
		item_type: 0,
		previous_share_id: '',
		type: 1,
		created_time: Date.now(),
		updated_time: Date.now(),
	});
};

export const down = async (db: DbConnection) => {
	await db.schema.dropTable('changes_2');
};
