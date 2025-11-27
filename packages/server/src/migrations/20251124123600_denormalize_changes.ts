import { DbConnection } from '../db';
import { ChangeType, Uuid } from '../services/database/types';

type ChangeEntryOriginal = {
	counter: number;
	id: Uuid;
	item_id: Uuid;
	previous_item: string;
	user_id: Uuid;
	type: ChangeType;
	updated_time: string;
	created_time: string;
};

export const up = async (db: DbConnection) => {
	await db.schema.createTable('changes_2', (table) => {
		// Note that in this table, the counter is the primary key, since
		// we want it to be automatically incremented. There's also a
		// column ID to publicly identify a change.
		table.increments('counter').unique().primary().notNullable();
		table.string('id', 32).unique().notNullable();
		table.string('item_id', 32).notNullable();
		table.string('user_id', 32).defaultTo('').notNullable();
		table.string('previous_share_id', 32).defaultTo('').notNullable();
		table.integer('type').notNullable();
		table.bigInteger('updated_time').notNullable();
		table.bigInteger('created_time').notNullable();

		table.unique(['counter', 'user_id']);
		table.index('id');
	});

	const batchSize = 512;
	let offset = 0;
	type ChangeRecord = ChangeEntryOriginal & { jop_share_id: Uuid };
	let changes: ChangeRecord[] = [];

	const next = async () => {
		const changeFields = ['id', 'type', 'user_id', 'previous_item', 'created_time', 'updated_time', 'counter'];
		const records = await db('changes')
			.select('items.jop_share_id', ...changeFields.map(f => `changes.${f}`))
			.where('changes.counter', '>', offset)
			.join('items', 'items.id', '=', 'changes.item_id')
			.limit(batchSize);
		if (!records.length) return false;

		offset = records[records.length - 1].counter;
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
		}

		const recipients = await db('share_users').select('user_id').where('share_id', '=', shareId);
		const participants = [...recipients.map(r => r.user_id), matchingShares[0].owner_id];
		shareToParticipants.set(shareId, participants);
		return participants;
	};

	while (await next()) {
		const rows = [];
		for (const change of changes) {
			const previousShareId = change.previous_item ? JSON.parse(change.previous_item)?.jop_share_id : '';
			const updatedChange = {
				previous_share_id: previousShareId,
				id: change.id,
				type: change.type,
				item_id: change.item_id,
				user_id: change.user_id,
				updated_time: change.updated_time,
				created_time: change.created_time,
			};
			rows.push(updatedChange);

			// TODO: This also needs to push ({ type: Update })s when the current update is the last update
			// **and** the last update changes the share_id. Currently, it doesn't.
			if (change.jop_share_id && previousShareId === change.jop_share_id) {
				// Create one update per user
				for (const participantId of await getShareParticipants(change.jop_share_id)) {
					if (participantId === change.user_id) continue;

					rows.push({
						...updatedChange,
						user_id: participantId,
					});
				}
			}
		}
		await db('changes_2').insert(rows);
	}
};

export const down = async (db: DbConnection) => {
	await db.schema.dropTable('changes_2');
};
