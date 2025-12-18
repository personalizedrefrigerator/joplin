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
};

// It should be possible to pause and resume the migration in the background
export const config = { transaction: false };


const validateChangeMigration = async (db: DbConnection, maximumCounter: number, limit: number) => {
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


	const batchSize = 10_000;
	// The number of items in each batch to validate. Larger values reduce performance,
	// but improve confidence in the results.
	const validationCount = 100;

	if (offset > 0) {
		logger.info('Resuming... Validating last migrated changes...');
		try {
			await validateChangeMigration(db, offset, validationCount);
		} catch (error) {
			logger.warn('Validation failed. The in-progress migration table will be deleted and the migration will need to be re-run. Error:', error);
			await db.schema.dropTable('changes_2');
			throw error;
		}
	}

	let counterRange: [number, number] = [offset, offset];
	const next = async () => {
		const nextBatch = await db('changes')
			.select('counter')
			.where('counter', '>=', offset)
			.orderBy('counter', 'asc')
			.limit(batchSize);
		if (!nextBatch.length) {
			return false;
		}

		const processFrom = offset;
		const processTo = nextBatch[nextBatch.length - 1].counter;
		counterRange = [processFrom, processTo];

		offset = processTo + 1; // The start of the next unprocessed block
		return true;
	};

	let processedCount = 0;
	while (await next()) {
		const previousShareIdSql = `
			CASE WHEN changes.previous_item=''
				THEN ''
				ELSE COALESCE(${isPostgres(db) ? '"changes"."previous_item"::json' : 'changes.previous_item'} ->> 'jop_share_id', '')
			END
		`;
		const uuidSelector = isPostgres(db) ? `
			regexp_replace(gen_random_uuid()::text, '-', '', 'g')
		` : `
			-- TODO: Check for a better way to generate IDs in SQLite.
			-- This hex(randomblob) approach is mentioned in the SQLite documentation:
			-- https://sqlite.org/lang_corefunc.html#randomblob
			lower(hex(randomblob(16)))
		`;
		await db.transaction(async transaction => {
			const result = await transaction.raw(`
				WITH all_share_ids AS (
					SELECT DISTINCT (${previousShareIdSql}) as included_share_id FROM changes
					WHERE changes.counter >= ?
					AND changes.counter <= ?
					AND ${previousShareIdSql} != ''
				), share_participants AS (
						SELECT user_id, share_id FROM share_users
							-- Performance: Filter out all share_ids that aren't used in the batch:
							JOIN all_share_ids ON share_users.share_id = all_share_ids.included_share_id
							WHERE status = 1 -- Only users that accepted the share
					UNION ALL
						SELECT owner_id AS user_id, id as share_id FROM shares
							JOIN all_share_ids ON shares.id = all_share_ids.included_share_id
					UNION ALL
						-- Placeholder for "the user that authored the change"
						SELECT NULL AS user_id, '{placeholder}' AS share_id
				)
				INSERT INTO changes_2 (previous_share_id, id, type, item_id, item_name, user_id, updated_time, created_time)
					SELECT
						(${previousShareIdSql}) as previous_share_id,
						(
							CASE WHEN share_participants.user_id IS NULL
									-- This query runs for share_participants.user_id in (null, ...), where ...
									-- sometimes includes changes.user_id. If it does, we need this check to prevent
									-- the migrated change from being added twice for the current user.
									OR share_participants.user_id = changes.user_id 
								THEN changes.id
								ELSE ${uuidSelector}
							END
						) as id,
						changes.type,
						changes.item_id,
						changes.item_name,
						COALESCE(share_participants.user_id, changes.user_id) as user_id,
						changes.updated_time,
						changes.created_time
					FROM changes
					LEFT JOIN share_participants ON
						share_participants.share_id IN ((${previousShareIdSql}), '{placeholder}')
					WHERE changes.counter >= ?
					AND changes.counter <= ?
					ORDER BY changes.counter ASC
					-- This ON CONFLICT handles the case where two changes were created with the same ID. This is sometimes
					-- done intentionally (see the "as id" block above) as a way to prevent a particular change from being
					-- added twice for the same user.
					ON CONFLICT DO NOTHING
			`, [counterRange[0], counterRange[1], counterRange[0], counterRange[1]]);
			processedCount += result.rowCount;
		});

		logger.info('Processed', processedCount, '/', total, `(start=${counterRange[0]}, end=${counterRange[1]})`);

		// Validate: Select some of the original changes and verify that they were migrated
		await validateChangeMigration(db, counterRange[1], validationCount);
	}
};

export const down = async (db: DbConnection) => {
	await db.schema.dropTable('changes_2');
};
