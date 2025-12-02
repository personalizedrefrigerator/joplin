import Logger from '@joplin/utils/Logger';
import { DbConnection, isPostgres } from '../db';
import { ChangeType, Uuid } from '../services/database/types';
import { uuidgen } from '@joplin/lib/uuid';

const logger = Logger.create('denormalize_changes');

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

			table.unique(['counter', 'user_id']);
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
	logger.info('Migrating', total, 'changes...');

	const batchSize = 512;
	type ChangeRecord = ChangeEntryOriginal & { jop_share_id: Uuid };
	let changes: ChangeRecord[] = [];

	const next = async () => {
		const changeFields = ['id', 'type', 'user_id', 'item_id', 'created_time', 'updated_time', 'counter'];
		const previousItemAsJsonSelector = isPostgres(db) ? '"previous_item"::json' : '"previous_item"';
		const records = await db('changes')
			.select(
				'items.jop_share_id',
				...changeFields.map(f => `changes.${f}`),
				db.raw(`(
					CASE WHEN previous_item='' THEN ''
            			ELSE COALESCE(${previousItemAsJsonSelector} ->> 'jop_share_id', '')
					END
				) as previous_item_share_id`),
			)
			.where('changes.counter', '>=', offset)
			.leftJoin('items', 'items.id', '=', 'changes.item_id')
			.orderBy('counter', 'asc')
			.limit(batchSize);
		if (!records.length) {
			changes = [];
			return false;
		}

		offset = records[records.length - 1].counter + 1;
		changes = records;
		return true;
	};
	const shareToParticipants = new Map<Uuid, Uuid[]>();
	const getShareParticipants = async (shareId: Uuid) => {
		if (shareToParticipants.has(shareId)) {
			return shareToParticipants.get(shareId);
		}

		const matchingShares = await db('shares').select('owner_id').where('id', '=', shareId);
		if (!matchingShares.length) {
			shareToParticipants.set(shareId, []);
			return [];
		}

		const recipients = await db('share_users').select('user_id').where('share_id', '=', shareId);
		const participants = [...recipients.map(r => r.user_id), matchingShares[0].owner_id];
		shareToParticipants.set(shareId, participants);
		return participants;
	};

	let processedCount = 0;
	while (await next()) {
		for (const change of changes) {
			const previousShareId = change.previous_item_share_id;
			const updatedChange = {
				previous_share_id: previousShareId,
				id: change.id,
				type: change.type,
				item_id: change.item_id,
				user_id: change.user_id,
				updated_time: change.updated_time,
				created_time: change.created_time,
			};

			const shareParticipants = await getShareParticipants(change.jop_share_id);
			await db.transaction(async transaction => {
				await transaction('changes_2').insert(updatedChange);

				if (change.jop_share_id && previousShareId === change.jop_share_id) {
					// Create one update per user
					for (const participantId of shareParticipants) {
						if (participantId === change.user_id) continue;

						await transaction('changes_2').insert({
							...updatedChange,
							id: uuidgen(),
							user_id: participantId,
						});
					}
				}
			});
		}

		processedCount += changes.length;
		logger.info('Processed', processedCount, '/', total);
	}
};

export const down = async (db: DbConnection) => {
	await db.schema.dropTable('changes_2');
};
