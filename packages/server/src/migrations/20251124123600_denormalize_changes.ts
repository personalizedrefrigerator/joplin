import Logger from '@joplin/utils/Logger';
import { DbConnection, isPostgres } from '../db';
import { Uuid } from '../services/database/types';

const logger = Logger.create('denormalize_changes');

// A snapshot of ChangeType at the time of this migration
enum ChangeType {
	Create = 1,
	Update = 2,
	Delete = 3,
}

type ChangeEntryOriginal = {
	counter: number;
	id: Uuid;
	item_id: Uuid;
	jop_share_id: Uuid;
	previous_item_share_id: Uuid;
	user_id: Uuid;
	type: ChangeType;
	updated_time: string;
	created_time: string;
};

// It should be possible to pause and resume the migration in the background
export const config = { transaction: false };

export const up = async (db: DbConnection) => {

	await db.transaction(async transaction => {
		if (await transaction.schema.hasTable('changes_2')) return;

		await transaction.schema.createTable('changes_2', (table) => {
			// Note that in this table, the counter is the primary key, since
			// we want it to be automatically incremented. There's also a
			// column ID to publicly identify a change.
			table.increments('counter').unique().primary().notNullable();
			table.string('id', 32).unique().notNullable();
			table.string('item_id', 32).notNullable();
			table.string('user_id', 32).defaultTo('').notNullable();
			table.text('item_name').defaultTo('').notNullable();
			table.string('previous_share_id', 32).defaultTo('').notNullable();
			table.integer('type').notNullable();
			table.bigInteger('updated_time').notNullable();
			table.bigInteger('created_time').notNullable();

			// TODO: What is the performance change if the "unique" index is removed here?
			table.index(['user_id', 'counter']);
			table.unique(['user_id', 'counter']);
		});
	});

	// Storing the start offset allows the migration to be resumed after an interruption
	const startOffset = async () => {
		let processedItem: ChangeEntryOriginal|undefined = undefined;
		const nextProcessedItemFromEnd = async () => {
			let lastItemQuery = db('changes_2')
				.select('id', 'counter');
			if (processedItem) {
				lastItemQuery = lastItemQuery.where('counter', '<', processedItem.counter);
			}
			processedItem = await lastItemQuery.orderBy('counter', 'desc').first();
		};

		let originalItem;
		do {
			await nextProcessedItemFromEnd();
			if (!processedItem) return 0;

			originalItem = await db('changes').select('id', 'counter').where('id', '=', processedItem.id).first();
		} while (!originalItem);

		const lastCounter = originalItem.counter;
		const nextCounter = lastCounter + 1;
		return nextCounter;
	};

	let offset = await startOffset();
	const total = Object.values(await db('changes').count().where('counter', '>=', offset).first())[0];
	logger.info('Migrating', total, 'changes... start', offset);

	const validateChangeMigration = async (maximumCounter: number, limit: number) => {
		const originalChanges = await db('changes').select('id', 'counter', 'type', 'previous_item')
			.where('counter', '<', maximumCounter)
			.orderBy('counter', 'desc')
			.limit(limit);


		for (const change of originalChanges) {
			const migratedChanges = await db('changes_2')
				.select('id', 'counter', 'type', 'previous_share_id')
				.where('id', '=', change.id);

			const validationError = (message: string) =>
				new Error(`Validation failed: Change failed to migrate (${JSON.stringify(change)}->${JSON.stringify(migratedChanges)}): ${message}`);

			if (migratedChanges.length !== 1) {
				throw validationError('Migrated change not found.');
			} else {
				const migrated = migratedChanges[0];
				if (migrated.type !== change.type) {
					throw validationError(`Migrated change has wrong type. Was: ${migrated.type}, expected: ${change.type}`);
				} else if (migrated.type === ChangeType.Update) {
					const previousShareId = JSON.parse(change.previous_item || '{}').jop_share_id;
					if (migrated.previous_share_id !== previousShareId) {
						throw validationError(
							`Wrong previous_share_id. Was: ${migrated.previous_share_id}, expected: ${previousShareId}.`,
						);
					}
				}
			}
		}
	};

	if (offset > 0) {
		logger.info('Resuming... Validating last migrated changes...');
		try {
			await validateChangeMigration(offset, 100);
		} catch (error) {
			logger.warn('Validation failed. The in-progress migration table will be deleted and the migration will need to be re-run. Error:', error);
			await db.schema.dropTable('changes_2');
			throw error;
		}
	}

	const batchSize = 4000;
	let counterRange: [number, number] = [offset, offset];
	const next = async () => {
		const nextCounters = await db('changes')
			.select('counter')
			.where('counter', '>', offset)
			.orderBy('counter', 'asc')
			.limit(batchSize);
		if (!nextCounters.length) {
			return false;
		}

		const oldOffset = offset;
		const newOffset = nextCounters[nextCounters.length - 1].counter;
		counterRange = [oldOffset, newOffset];
		offset = newOffset;

		return true;
	};

	let processedCount = 0;
	while (await next()) {
		const previousItemAsJsonSelector = isPostgres(db) ? '"changes"."previous_item"::json' : 'changes.previous_item';
		// TODO: This won't work in SQLite:
		const uuidSelector = isPostgres(db) ? 'regexp_replace(gen_random_uuid()::text, \'-\', \'\', \'g\')' : 'regexp_replace(gen_random_uuid(), \'-\', \'\', \'g\')';
		await db.transaction(async transaction => {
			const result = await transaction.raw(`
				WITH share_participants AS (
						SELECT user_id, share_id FROM share_users
					UNION ALL
						SELECT owner_id AS user_id, id as share_id FROM shares
				)
				INSERT INTO changes_2 (previous_share_id, id, type, item_id, user_id, updated_time, created_time)
					SELECT
						COALESCE(share_participants.share_id, '') as previous_share_id,
						(
							CASE WHEN (share_participants.share_id IS NULL) OR (changes.user_id = share_participants.user_id)
								THEN changes.id
								ELSE ${uuidSelector}
							END
						) as id,
						changes.type,
						changes.item_id,
						(
							CASE WHEN share_participants.share_id IS NULL
								THEN changes.user_id
								ELSE share_participants.user_id
							END
						) as user_id,
						changes.updated_time,
						changes.created_time
					FROM changes
					LEFT JOIN share_participants ON share_participants.share_id = (
						CASE WHEN changes.previous_item=''
							THEN ''
							ELSE COALESCE(${previousItemAsJsonSelector} ->> 'jop_share_id', '')
						END
					)
					WHERE changes.counter >= ?
					AND changes.counter < ?
					ORDER BY changes.counter ASC
				${
	// This "ON CONFLICT DO NOTHING" is necessary to handle the case where the same user ID is present multiple
	// times for the same share (e.g. if a user is both in share_users and is the share owner).
	'ON CONFLICT DO NOTHING'
}
			`, [counterRange[0], counterRange[1]]);
			processedCount += result.rowCount;
		});

		logger.info('Processed', processedCount, '/', total);

		// Validate: Select some of the original changes and verify that they were migrated
		await validateChangeMigration(counterRange[1], batchSize);// Math.min(40, Math.ceil(batchSize / 10)));
	}
};

export const down = async (db: DbConnection) => {
	await db.schema.dropTable('changes_2');
};
