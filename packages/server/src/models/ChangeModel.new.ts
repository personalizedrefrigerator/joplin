import { Knex } from 'knex';
import Logger from '@joplin/utils/Logger';
import { DbConnection, SqliteMaxVariableNum } from '../db';
import { Changes2, ChangeType, Item, Uuid } from '../services/database/types';
import { ErrorResyncRequired } from '../utils/errors';
import { Day, formatDateTime } from '../utils/time';
import BaseModel, { SaveOptions } from './BaseModel';
import { PaginatedResults } from './utils/pagination';
import { NewModelFactoryHandler } from './factory';
import { Config } from '../utils/types';
import { BaseItemEntity } from '@joplin/lib/services/database/types';
import type { RecordChangeOptions as RecordChangeOptionsBase } from './ChangeModel';

const logger = Logger.create('ChangeModel');


export const defaultChangeTtl = 180 * Day;

export interface DeltaChange extends Changes2 {
	jop_updated_time?: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	jopItem?: any;
}

export type PaginatedDeltaChanges = PaginatedResults<DeltaChange>;

export type PaginatedChanges = PaginatedResults<Changes2>;

export interface ChangePagination {
	limit?: number;
	cursor?: string;
}

export interface ChangePreviousItem {
	jop_share_id: string;
}

interface RecordChangeOptions extends RecordChangeOptionsBase {
	// An ID that **at least** one of the new change entities should be assigned.
	// This is used to ensure that change IDs stay in sync between the old and new
	// changes tables.
	changeId: Uuid;
}

export function defaultDeltaPagination(): ChangePagination {
	return {
		limit: 200,
		cursor: '',
	};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
export function requestDeltaPagination(query: any): ChangePagination {
	if (!query) return defaultDeltaPagination();

	const output: ChangePagination = {};
	if ('limit' in query) output.limit = query.limit;
	if ('cursor' in query) output.cursor = query.cursor;
	return output;
}

export default class ChangeModel extends BaseModel<Changes2> {

	public deltaIncludesItems_: boolean;

	public constructor(db: DbConnection, dbSlave: DbConnection, modelFactory: NewModelFactoryHandler, config: Config) {
		super(db, dbSlave, modelFactory, config);
		this.deltaIncludesItems_ = config.DELTA_INCLUDES_ITEMS;
	}

	public get tableName(): string {
		return 'changes_2';
	}

	protected hasUuid(): boolean {
		return true;
	}

	public changeUrl(): string {
		return `${this.baseUrl}/changes`;
	}

	public async allFromId(id: string, limit: number = SqliteMaxVariableNum): Promise<PaginatedChanges> {
		const startChange = id ? await this.load(id) : null;
		const query = this.db(this.tableName).select(...this.defaultFields);
		if (startChange) void query.where('counter', '>', startChange.counter);
		void query.limit(limit).orderBy('counter', 'asc');
		let results: Changes2[] = await query;
		const hasMore = !!results.length;
		const cursor = results.length ? results[results.length - 1].id : id;
		results = await this.removeDeletedItems(results);
		results = await this.compressChanges_(results);
		return {
			items: results,
			has_more: hasMore,
			cursor,
		};
	}


	public async changesForUserQuery(userId: Uuid, fromCounter: number, limit: number, doCountQuery: boolean): Promise<Changes2[]> {
		const fields = [
			'id',
			'item_id',
			'item_name',
			'previous_share_id',
			'type',
			'updated_time',
			'counter',
		];

		const fieldsSql = `"${fields.join('", "')}"`;

		const rawQuerySql = `
			SELECT ${fieldsSql}
			FROM "changes_2"
			WHERE counter > ?
				AND user_id = ?
				-- Filtering: Remove 'Update' changes for deleted items:
				AND (type != ? OR EXISTS (
					SELECT 1
					FROM user_items
					WHERE user_items.item_id = changes_2.item_id
				))
			ORDER BY "counter" ASC
			${doCountQuery ? '' : 'LIMIT ?'}
		`;

		const params = [
			fromCounter,
			userId,
			ChangeType.Update,
		];

		if (!doCountQuery) params.push(limit);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		let query: Knex.Raw<any> = null;

		if (!doCountQuery) {
			query = this.dbSlave.raw(rawQuerySql, params);
		} else {
			query = this.dbSlave.raw(`
				SELECT count(*) as total
				FROM (
					(${rawQuerySql})
				) AS merged
			`, params);
		}

		const results = await query;

		// Because it's a raw query, we need to handle the results manually:
		// Postgres returns an object with a "rows" property, while SQLite
		// returns the rows directly;
		const output: Changes2[] = results.rows ? results.rows : results;

		// This property is present only for the purpose of ordering the results
		// and can be removed afterwards.
		for (const change of output) delete change.counter;

		return output;
	}

	public async delta(userId: Uuid, pagination: ChangePagination): Promise<PaginatedDeltaChanges> {
		let changeAtCursor: Changes2 = null;

		if (pagination.cursor) {
			changeAtCursor = await this.load(pagination.cursor);
			if (!changeAtCursor) throw new ErrorResyncRequired();
		}

		const changes = await this.changesForUserQuery(
			userId,
			changeAtCursor ? changeAtCursor.counter : -1,
			pagination.limit,
			false,
		);

		let items: Item[] = await this.db('items').select('id', 'jop_updated_time').whereIn('items.id', changes.map(c => c.item_id));

		let processedChanges = this.compressChanges_(changes);
		processedChanges = await this.removeDeletedItems(processedChanges, items);

		if (this.deltaIncludesItems_) {
			items = await this.models().item().loadWithContentMulti(processedChanges.map(c => c.item_id), {
				fields: [
					'content',
					'id',
					'jop_encryption_applied',
					'jop_id',
					'jop_parent_id',
					'jop_share_id',
					'jop_type',
					'jop_updated_time',
				],
			});
		}

		const finalChanges = processedChanges.map(change => {
			const item = items.find(item => item.id === change.item_id);
			if (!item) {
				return this.deltaIncludesItems_ ? {
					...change,
					jopItem: null as BaseItemEntity,
				} : { ...change };
			}
			const deltaChange: DeltaChange = {
				...change,
				jop_updated_time: item.jop_updated_time,
			};
			if (this.deltaIncludesItems_) {
				deltaChange.jopItem = item.jop_type ? this.models().item().itemToJoplinItem(item) : null;
			}
			return deltaChange;
		});

		return {
			items: finalChanges,
			// If we have changes, we return the ID of the latest changes from which delta sync can resume.
			// If there's no change, we return the previous cursor.
			cursor: changes.length ? changes[changes.length - 1].id : pagination.cursor,
			has_more: changes.length >= pagination.limit,
		};
	}

	private async removeDeletedItems(changes: Changes2[], items: Item[] = null): Promise<Changes2[]> {
		const itemIds = changes.map(c => c.item_id);

		// We skip permission check here because, when an item is shared, we need
		// to fetch files that don't belong to the current user. This check
		// would not be needed anyway because the change items are generated in
		// a context where permissions have already been checked.
		items = items === null ? await this.db('items').select('id').whereIn('items.id', itemIds) : items;

		const output: Changes2[] = [];

		for (const change of changes) {
			const item = items.find(f => f.id === change.item_id);

			// If the item associated with this change has been deleted, we have
			// two cases:
			// - If it's a "delete" change, add it to the list.
			// - If it's anything else, skip it. The "delete" change will be
			//   sent on one of the next pages.

			if (!item && change.type !== ChangeType.Delete) {
				continue;
			}

			output.push(change);
		}

		return output;
	}

	// Compresses the changes so that, for example, multiple updates on the same
	// item are reduced down to one, because calling code usually only needs to
	// know that the item has changed at least once. The reduction is basically:
	//
	//     create - update => create
	//     create - delete => NOOP
	//     update - update => update
	//     update - delete => delete
	//     delete - create => create
	//
	// There's one exception for changes that include a "previous_item". This is
	// used to save specific properties about the previous state of the item,
	// such as "jop_share_id" or "name". The share mechanism needs to know about
	// each change to "jop_share_id", so updates that change the share ID are not
	// compressed.
	//
	// The latest change, when an item goes from DELETE to CREATE seems odd but
	// can happen because we are not checking for "item" changes but for
	// "user_item" changes. When sharing is involved, an item can be shared
	// (CREATED), then unshared (DELETED), then shared again (CREATED). When it
	// happens, we want the user to get the item, thus we generate a CREATE
	// event.
	//
	// Public to allow testing.
	public compressChanges_(changes: Changes2[]): Changes2[] {
		const itemChanges = new Map<Uuid, Changes2>();

		const itemUniqueUpdates = new Map<Uuid, Changes2[]>();
		const itemToLastUpdateShareIds = new Map<Uuid, Uuid>();

		const changeToShareId = (change: Changes2) => {
			return change.previous_share_id ?? '';
		};

		for (const change of changes) {
			const itemId = change.item_id;
			const previous = itemChanges.get(itemId);

			if (change.type === ChangeType.Update) {
				const shareId = changeToShareId(change);

				const uniqueUpdates = itemUniqueUpdates.get(itemId);
				if (uniqueUpdates) {
					const lastShareId = itemToLastUpdateShareIds.get(itemId);
					const canCompress = lastShareId === shareId;

					if (canCompress) {
						// Always keep the last change as up-to-date as possible
						uniqueUpdates[uniqueUpdates.length - 1] = change;
					} else {
						uniqueUpdates.push(change);
						itemToLastUpdateShareIds.set(itemId, shareId);
					}
				} else {
					itemUniqueUpdates.set(itemId, [change]);
					itemToLastUpdateShareIds.set(itemId, shareId);
				}
			}

			if (previous) {
				if (previous.type === ChangeType.Create && change.type === ChangeType.Update) {
					continue;
				}

				if (previous.type === ChangeType.Create && change.type === ChangeType.Delete) {
					itemChanges.delete(itemId);
				}

				if (previous.type === ChangeType.Update && change.type === ChangeType.Update) {
					itemChanges.set(itemId, change);
				}

				if (previous.type === ChangeType.Update && change.type === ChangeType.Delete) {
					itemChanges.set(itemId, change);
				}

				if (previous.type === ChangeType.Delete && change.type === ChangeType.Create) {
					itemChanges.set(itemId, change);
				}
			} else {
				itemChanges.set(itemId, change);
			}
		}

		const output: Changes2[] = [];

		for (const [itemId, change] of itemChanges) {
			if (change.type === ChangeType.Update) {
				for (const otherChange of itemUniqueUpdates.get(itemId)) {
					output.push(otherChange);
				}
			} else {
				output.push(change);
			}
		}

		output.sort((a: Changes2, b: Changes2) => a.counter < b.counter ? -1 : +1);

		return output;
	}

	// See spec for complete documentation:
	// https://joplinapp.org/spec/server_delta_sync/#regarding-the-deletion-of-old-change-events
	public async compressOldChanges(ttl: number = null) {
		ttl = ttl === null ? defaultChangeTtl : ttl;
		const cutOffDate = Date.now() - ttl;
		const limit = 1000;
		const doneItemIds: Uuid[] = [];

		interface ChangeReportItem {
			total: number;
			max_created_time: number;
			item_id: Uuid;
		}

		let error: Error = null;
		let totalDeletedCount = 0;

		logger.info(`compressOldChanges: Processing changes older than: ${formatDateTime(cutOffDate)} (${cutOffDate})`);

		while (true) {
			// First get all the UPDATE changes before the specified date, and
			// order by the items that had the most changes. Also for each item
			// get the most recent change date from within that time interval,
			// as we need this below.

			const changeReport: ChangeReportItem[] = await this
				.db(this.tableName)

				.select(['item_id'])
				.countDistinct('id', { as: 'total' })
				.max('created_time', { as: 'max_created_time' })

				.where('type', '=', ChangeType.Update)
				.where('created_time', '<', cutOffDate)

				.groupBy('item_id')
				.havingRaw('count(id) > 1')
				.orderBy('total', 'desc')
				.limit(limit);

			if (!changeReport.length) break;

			await this.withTransaction(async () => {
				for (const row of changeReport) {
					if (doneItemIds.includes(row.item_id)) {
						// We don't throw from within the transaction because
						// that would rollback all other operations even though
						// they are valid. So we save the error and exit.
						error = new Error(`Trying to process an item that has already been done. Aborting. Row: ${JSON.stringify(row)}`);
						return;
					}

					// Still from within the specified interval, delete all
					// UPDATE changes, except for the most recent one.

					const deletedCount = await this
						.db(this.tableName)
						.where('type', '=', ChangeType.Update)
						.where('created_time', '<', cutOffDate)
						.where('created_time', '!=', row.max_created_time)
						.where('item_id', '=', row.item_id)
						.delete();

					totalDeletedCount += deletedCount;
					doneItemIds.push(row.item_id);
				}
			}, 'ChangeModel::compressOldChanges');

			logger.info(`compressOldChanges: Processed: ${doneItemIds.length} items. Deleted: ${totalDeletedCount} changes.`);

			if (error) throw error;
		}

		logger.info(`compressOldChanges: Finished processing. Done ${doneItemIds.length} items. Deleted: ${totalDeletedCount} changes.`);
	}

	public async save(change: Changes2, options: SaveOptions = {}): Promise<Changes2> {
		return super.save(change, options);
	}

	public async deleteByItemIds(itemIds: Uuid[]) {
		if (!itemIds.length) return;

		await this.db(this.tableName)
			.whereIn('item_id', itemIds)
			.delete();
	}

	public async recordChange({
		shareId, sourceUserId, itemId, itemName, type, previousItem, changeId,
	}: RecordChangeOptions) {
		let firstChangeId = changeId;
		const saveChangeForUser = async (userId: Uuid) => {
			// If provided, ensure that **at least one** of the changes saved matches the
			// given ID. For now, is used to ensure that every ID in the old changes table
			// is also in the new changes table. This logic will need to be removed when
			// removing ChangeModel.old.
			const id = firstChangeId;
			firstChangeId = null;

			await this.save({
				item_id: itemId,
				item_name: itemName,
				type,
				previous_share_id: previousItem.jop_share_id ?? '',
				user_id: userId,
				...(id ? { id } : {}),
			}, { isNew: true });
		};

		if (type === ChangeType.Update) {
			const share = shareId ? await this.models().share().load(shareId) : null;
			const allUserIds = share ? await this.models().share().allShareUserIds(share) : [sourceUserId];

			// Post a change for all users that can access the item
			for (const userId of allUserIds) {
				await saveChangeForUser(userId);
			}
		} else {
			// Sharing for create/delete actions is currently handled in a maintenance
			// task that runs periodically.
			await saveChangeForUser(sourceUserId);
		}
	}

}
