import { DbConnection } from '../db';

export const up = async (db: DbConnection) => {
	await db.schema.alterTable('shares', (table) => {
		table.string('app_min_version', 32).defaultTo('').notNullable();
	});
};

export const down = async (db: DbConnection) => {
	await db.schema.alterTable('shares', (table) => {
		table.dropColumn('app_min_version');
	});
};
