import { Knex } from 'knex';
import Logger from '@joplin/utils/Logger';
import { DbConnection, SqliteMaxVariableNum } from '../db';
import { Changes2, ChangeType, Uuid } from '../services/database/types';
import { Day, formatDateTime } from '../utils/time';
import BaseModel, { SaveOptions } from './BaseModel';
import { PaginatedResults } from './utils/pagination';
import { NewModelFactoryHandler } from './factory';
import { Config } from '../utils/types';
import type { RecordChangeOptions as RecordChangeOptionsBase } from './ChangeModel';

const logger = Logger.create('ChangeModel.new');


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

type RecordChangeOptions = RecordChangeOptionsBase;

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

	public constructor(db: DbConnection, dbSlave: DbConnection, modelFactory: NewModelFactoryHandler, config: Config) {
		super(db, dbSlave, modelFactory, config);
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

	public async first(): Promise<Changes2> {
		return await this.db(this.tableName).orderBy('counter', 'asc').first();
	}

	public async allFromId(id: string, limit: number = SqliteMaxVariableNum): Promise<Changes2[]> {
		const startChange: Changes2 = id ? await this.load(id) : null;
		const query = this.db(this.tableName).select(...this.defaultFields);
		if (startChange) void query.where('counter', '>', startChange.counter);
		void query.limit(limit).orderBy('counter', 'asc');
		return await query;
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
			ORDER BY "counter" ASC
			${doCountQuery ? '' : 'LIMIT ?'}
		`;

		const params = [
			fromCounter,
			userId,
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
		shareId, sourceUserId, itemId, itemName, itemType, type, previousItem,
	}: RecordChangeOptions) {
		const saveChangeForUser = async (userId: Uuid) => {
			await this.save({
				item_id: itemId,
				item_name: itemName,
				item_type: itemType,
				type,
				previous_share_id: previousItem.jop_share_id ?? '',
				user_id: userId,
			}, { isNew: true });
		};

		if (type === ChangeType.Update) {
			const share = shareId ? await this.models().share().load(shareId) : null;
			let allUserIds = share ? await this.models().share().allShareUserIds(share) : [sourceUserId];
			if (!allUserIds.includes(sourceUserId)) {
				logger.warn('Adding sourceUserId to allUserIds because it was missing');
				allUserIds = [...allUserIds, sourceUserId];
			}

			// Post a change for all users that can access the item
			for (const userId of allUserIds) {
				await saveChangeForUser(userId);
			}
		} else {
			await saveChangeForUser(sourceUserId);
		}
	}

}
