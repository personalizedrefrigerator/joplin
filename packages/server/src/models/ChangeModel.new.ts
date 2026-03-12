import Logger from '@joplin/utils/Logger';
import { DbConnection, SqliteMaxVariableNum } from '../db';
import { Changes2, ChangeType, Uuid } from '../services/database/types';
import { Day, formatDateTime } from '../utils/time';
import BaseModel, { LoadOptions, SaveOptions, UuidType } from './BaseModel';
import { PaginatedResults } from './utils/pagination';
import { NewModelFactoryHandler } from './factory';
import { Config } from '../utils/types';
import type { RecordChangeOptions as RecordChangeOptionsBase } from './ChangeModel';
import { uuidgen } from '../utils/uuid';
import dbuuid from '../utils/dbuuid';

const logger = Logger.create('ChangeModel.new');


export const defaultChangeTtl = 180 * Day;

export type PaginatedChanges = PaginatedResults<Changes2>;

type RecordChangeOptions = RecordChangeOptionsBase;

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

	public async first(options: LoadOptions): Promise<Changes2|undefined> {
		return await this.db(this.tableName)
			.select(options.fields ?? this.defaultFields)
			.orderBy('counter', 'asc')
			.first();
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

		let query = this.dbSlave(this.tableName);
		if (doCountQuery) {
			query = query.count('*', { as: 'total' });
		} else {
			query = query.select(fields);
		}
		query = query
			.where('counter', '>', fromCounter)
			.andWhere('user_id', '=', userId);

		if (!doCountQuery) {
			query = query
				.orderBy('counter', 'asc')
				.limit(limit);
		}

		const results: Changes2[] = await query;
		return results;
	}

	// See spec for complete documentation:
	// https://joplinapp.org/spec/server_delta_sync/#regarding-the-deletion-of-old-change-events
	public async compressOldChanges(ttl: number = null) {
		ttl = ttl === null ? defaultChangeTtl : ttl;
		const cutOffDate = Date.now() - ttl;
		const limit = 1000;
		const doneItemIds = new Set<Uuid>();

		interface ChangeReportItem {
			total: number;
			max_counter: number;
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

			const query = this
				.db
				.select({ item_id: 'item_id' })
				.fromRaw('changes_2 AS changes_2_outer')
				.countDistinct('id', { as: 'total' })
				.max('counter', { as: 'max_counter' })

				.where('type', '=', ChangeType.Update)
				.where('created_time', '<', cutOffDate)

				// Always keep the latest group of updates. Each user should retain at least one
				// UPDATE change for an item. Since updates events create one change for each user,
				// each with the same timestamp, filter out all events that have the latest timestamp:
				.andWhere(
					'created_time', '<',
					// For performance, select the most recent update's created time. This assumes that
					// more recent items have greater created_times:
					this.db(this.tableName)
						.select('created_time')
						.where('item_id', '=', this.db.raw('changes_2_outer.item_id'))
						.andWhere('type', '=', ChangeType.Update)
						.orderBy('counter', 'desc')
						.first(),
				)

				.groupBy('item_id')
				.orderBy('total', 'desc')
				.limit(limit);
			const changeReport: ChangeReportItem[] = await query;

			if (!changeReport.length) break;

			await this.withTransaction(async () => {
				for (const row of changeReport) {
					if (doneItemIds.has(row.item_id)) {
						// We don't throw from within the transaction because
						// that would rollback all other operations even though
						// they are valid. So we save the error and exit.
						error = new Error(`Trying to process an item that has already been done. Aborting. Row: ${JSON.stringify(row)}`);
						return;
					}

					// Still from within the specified interval, delete all
					// UPDATE changes, except for the most recent one (if any).

					const deletedCount = await this
						.db(this.tableName)
						.where('type', '=', ChangeType.Update)
						.where('created_time', '<', cutOffDate)
						.where('counter', '<=', row.max_counter)
						.where('item_id', '=', row.item_id)
						.delete();

					totalDeletedCount += deletedCount;
					doneItemIds.add(row.item_id);
				}
			}, 'ChangeModel::compressOldChanges');

			logger.info(`compressOldChanges: Processed: ${doneItemIds.size} items. Deleted: ${totalDeletedCount} changes.`);

			if (error) throw error;
		}

		logger.info(`compressOldChanges: Finished processing. Done ${doneItemIds.size} items. Deleted: ${totalDeletedCount} changes.`);
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
		const changes: Changes2[] = [];

		// All per-user changes for the same item are given the same created/updated time
		// to simplify grouping these changes together during change compression:
		const time = Date.now();

		const addChangeForUser = (userId: Uuid) => {
			changes.push({
				item_id: itemId,
				item_name: itemName,
				item_type: itemType,
				type,
				previous_share_id: previousItem.jop_share_id ?? '',
				user_id: userId,
				id: this.uuidType() === UuidType.NanoId ? uuidgen() : dbuuid(),
				created_time: time,
				updated_time: time,
			});
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
				addChangeForUser(userId);
			}
		} else {
			addChangeForUser(sourceUserId);
		}

		// For performance, apply all of the changes at once. Applying the changes one at a time
		// can take several seconds to run for large shares.
		await this.db(this.tableName).insert(changes);
	}

}
