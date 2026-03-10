import { Knex } from 'knex';
import Logger from '@joplin/utils/Logger';
import { DbConnection, SqliteMaxVariableNum, isPostgres } from '../db';
import { Change, ChangeType, Uuid } from '../services/database/types';
import { Day, formatDateTime } from '../utils/time';
import BaseModel, { SaveOptions } from './BaseModel';
import { PaginatedResults } from './utils/pagination';
import { NewModelFactoryHandler } from './factory';
import { Config } from '../utils/types';
import type { RecordChangeOptions } from './ChangeModel';

const logger = Logger.create('ChangeModel');

export const defaultChangeTtl = 180 * Day;

export interface DeltaChange extends Change {
	jop_updated_time?: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	jopItem?: any;
}

export type PaginatedDeltaChanges = PaginatedResults<DeltaChange>;

export type PaginatedChanges = PaginatedResults<Change>;

export interface ChangePagination {
	limit?: number;
	cursor?: string;
}

export interface ChangePreviousItem {
	jop_share_id: string;
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

export default class ChangeModel extends BaseModel<Change> {

	public constructor(db: DbConnection, dbSlave: DbConnection, modelFactory: NewModelFactoryHandler, config: Config) {
		super(db, dbSlave, modelFactory, config);
	}

	public get tableName(): string {
		return 'changes';
	}

	protected hasUuid(): boolean {
		return true;
	}

	public serializePreviousItem(item: ChangePreviousItem): string {
		return JSON.stringify(item);
	}

	public unserializePreviousItem(item: string): ChangePreviousItem {
		if (!item) return null;
		return JSON.parse(item);
	}

	public changeUrl(): string {
		return `${this.baseUrl}/changes`;
	}

	public async allFromId(id: string, limit: number = SqliteMaxVariableNum) {
		const startChange: Change = id ? await this.load(id) : null;
		const query = this.db(this.tableName).select(...this.defaultFields);
		if (startChange) void query.where('counter', '>', startChange.counter);
		void query.limit(limit).orderBy('counter', 'asc');
		const results: Change[] = await query;
		return results;
	}

	public async changesForUserQuery(userId: Uuid, fromCounter: number, limit: number, doCountQuery: boolean): Promise<Change[]> {
		// When need to get:
		//
		// - All the CREATE and DELETE changes associated with the user
		// - All the UPDATE changes that applies to items associated with the
		//   user.
		//
		// UPDATE changes do not have the user_id set because they are specific
		// to the item, not to a particular user.

		// The extra complexity is due to the fact that items can be shared between users.
		//
		// - CREATE: When a user creates an item, a corresponding user_item is added to their
		//   collection. When that item is shared with another user, a user_item is also added to
		//   that user's collection, via ShareModel::updateSharedItems(). Each user has their own
		//   `change` object for the creation operations. For example if a user shares a note with
		//   two users, there will be a total of three `change` objects for that item, each
		//   associated with on of these users. See UserItemModel::addMulti()
		//
		// - DELETE: When an item is deleted, all corresponding user_items are deleted. Likewise,
		//   there's a `change` object per user. See UserItemModel::deleteBy()
		//
		// - UPDATE: Updates are different because only one `change` object will be created per
		//   change, even if the item is shared multiple times. This is why we need a different
		//   query for it. See ItemModel::save()

		// This used to be just one query but it kept getting slower and slower
		// as the `changes` table grew. So it is now split into two queries
		// merged by a UNION ALL.

		const fields = [
			'id',
			'item_id',
			'item_name',
			'type',
			'updated_time',
			'counter',
		];

		const fieldsSql = `"${fields.join('", "')}"`;

		const subQuery1 = `
			SELECT ${fieldsSql}
			FROM "changes"
			WHERE counter > ?
			AND (type = ? OR type = ?)
			AND user_id = ?
			ORDER BY "counter" ASC
			${doCountQuery ? '' : 'LIMIT ?'}
		`;

		const subParams1 = [
			fromCounter,
			ChangeType.Create,
			ChangeType.Delete,
			userId,
		];

		if (!doCountQuery) subParams1.push(limit);

		// The "+ 0" was added to prevent Postgres from scanning the `changes` table in `counter`
		// order, which is an extremely slow query plan. With "+ 0" it went from 2 minutes to 6
		// seconds for a particular query. https://dba.stackexchange.com/a/338597/37012
		//
		// ## 2025-11-06
		//
		// Remove the "+ 0" because now it appears to make query slower by preventing the query
		// planner from using the index. Using Postgres 16.8
		//
		// ## 2025-11-08
		//
		// This query shape, with `ui AS MATERIALIZED` ensures that Postgres query planner will use
		// the index `changes_item_id_counter_type2_index`, which was created specifically for that
		// query. With the join (as previously) the planner uses the `counter` index and ends up
		// walking through millions of rows in the `changes` table.
		//
		// This new query improves this part, however it's still not perfect because it will be
		// relatively slow for users with hundreds of thousands of items. But at least the
		// performance won't be bound to the size of the `changes` table anymore, and it will be
		// fast for users with a normal amount of items.
		//
		// Keeping the previous query here because it's more readable and equivalent. It could be a
		// use as a base for a refactoring:
		//
		// ```
		// SELECT ${changesFieldsSql}
		// FROM "changes"
		// JOIN "user_items" ON user_items.item_id = changes.item_id
		// WHERE counter > ?
		// AND type = ?
		// AND user_items.user_id = ?
		// ORDER BY "counter" ASC
		// ${doCountQuery ? '' : 'LIMIT ?'}
		// ```

		const changesFieldsSql = fields
			.map(f => `"changes"."${f}" AS "${f}"`)
			.join(', ');

		const subQuery2 = `
			WITH ui AS MATERIALIZED (
				SELECT item_id
				FROM user_items
				WHERE user_id = ?
			)
			SELECT ${changesFieldsSql}
			FROM changes
			WHERE type = ?
				AND counter > ?
				AND EXISTS (
					SELECT 1
					FROM ui
					WHERE ui.item_id = changes.item_id
				)
			ORDER BY counter
			${doCountQuery ? '' : 'LIMIT ?'}
		`;

		const subParams2 = [
			userId,
			ChangeType.Update,
			fromCounter,
		];

		if (!doCountQuery) subParams2.push(limit);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		let query: Knex.Raw<any> = null;

		const finalParams = subParams1.concat(subParams2);

		// For Postgres, we need to use materialized tables because, even
		// though each independent query is fast, the query planner end up going
		// for a very slow plan when they are combined with UNION ALL.
		// https://dba.stackexchange.com/a/333147/37012
		//
		// Normally we could use the same query for SQLite since it supports
		// materialized views too, but it doesn't work for some reason so we
		// keep the non-optimised query.

		if (!doCountQuery) {
			finalParams.push(limit);

			if (isPostgres(this.dbSlave)) {
				query = this.dbSlave.raw(`
					WITH cte1 AS MATERIALIZED (
						${subQuery1}
					)
					, cte2 AS MATERIALIZED (
						${subQuery2}
					)
					TABLE cte1
					UNION ALL
					TABLE cte2
					ORDER BY counter ASC
					LIMIT ?
				`, finalParams);
			} else {
				query = this.dbSlave.raw(`
					SELECT ${fieldsSql} FROM (${subQuery1}) as sub1
					UNION ALL				
					SELECT ${fieldsSql} FROM (${subQuery2}) as sub2
					ORDER BY counter ASC
					LIMIT ?
				`, finalParams);
			}
		} else {
			query = this.dbSlave.raw(`
				SELECT count(*) as total
				FROM (
					(${subQuery1})
					UNION ALL				
					(${subQuery2})
				) AS merged
			`, finalParams);
		}

		const results = await query;

		// Because it's a raw query, we need to handle the results manually:
		// Postgres returns an object with a "rows" property, while SQLite
		// returns the rows directly;
		const output: Change[] = results.rows ? results.rows : results;

		// This property is present only for the purpose of ordering the results
		// and can be removed afterwards.
		for (const change of output) delete change.counter;

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

	public async save(change: Change, options: SaveOptions = {}): Promise<Change> {
		return super.save(change, options);
	}

	public async deleteByItemIds(itemIds: Uuid[]) {
		if (!itemIds.length) return;

		await this.db(this.tableName)
			.whereIn('item_id', itemIds)
			.delete();
	}

	public async recordChange({
		sourceUserId, itemId, itemName, type, previousItem, itemType,
	}: RecordChangeOptions) {
		return await this.save({
			item_type: itemType,
			item_id: itemId,
			item_name: itemName,
			type,
			previous_item: this.serializePreviousItem(previousItem),
			user_id: sourceUserId,
		});
	}
}
