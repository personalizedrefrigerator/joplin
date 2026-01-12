import Logger from '@joplin/utils/Logger';
import { DbConnection, SqliteMaxVariableNum } from '../db';
import { Change, ChangeType, Uuid, ItemType } from '../services/database/types';
import { Day } from '../utils/time';
import { PaginatedResults } from './utils/pagination';
import { NewModelFactoryHandler } from './factory';
import { Config } from '../utils/types';
import ChangeModelOld from './ChangeModel.old';
import ChangeModelNew from './ChangeModel.new';

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

export interface RecordChangeOptions {
	itemName: string;
	itemId: Uuid;
	sourceUserId: Uuid;
	shareId: Uuid|'';
	previousItem: ChangePreviousItem;
	type: ChangeType;
	itemType: ItemType;
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

export default class ChangeModel {

	public oldModel_: ChangeModelOld;
	public newModel_: ChangeModelNew;

	public constructor(db: DbConnection, dbSlave: DbConnection, modelFactory: NewModelFactoryHandler, private config: Config) {
		this.oldModel_ = new ChangeModelOld(db, dbSlave, modelFactory, config);

		this.newModel_ = new ChangeModelNew(db, dbSlave, modelFactory, config);
		// performance: Disabled until newModel_ is used for more than testing
		this.newModel_.deltaIncludesItems_ = false;
	}

	public changeUrl(): string {
		return `${this.config.baseUrl}/changes`;
	}

	public async allFromId(id: string, limit: number = SqliteMaxVariableNum): Promise<PaginatedChanges> {
		return this.oldModel_.allFromId(id, limit);
	}

	public async count() {
		return this.oldModel_.count();
	}

	public async all() {
		return this.oldModel_.all();
	}

	// Public for testing
	public async changesForUserQuery(userId: Uuid, fromCounter: number, limit: number, doCountQuery: boolean): Promise<Change[]> {
		return await this.oldModel_.changesForUserQuery(userId, fromCounter, limit, doCountQuery);
	}

	public async delta(userId: Uuid, pagination: ChangePagination = null): Promise<PaginatedDeltaChanges> {
		pagination = {
			...defaultDeltaPagination(),
			...pagination,
		};

		const resultsOld = await this.oldModel_.delta(userId, pagination);
		const resultsNew = await this.newModel_.delta(userId, pagination);

		const newIds = new Set(resultsNew.items.map(item => item.item_id));
		const oldIds = new Set(resultsOld.items.map(item => item.item_id));

		const hasDifferentIds = newIds.size !== oldIds.size || !newIds.isSubsetOf(oldIds);
		if (hasDifferentIds) {
			const differentIds = [...newIds.difference(oldIds)];
			logger.warn('Differing delta results:', differentIds);
			throw new Error(`Different delta results: ${differentIds} (size from new: ${newIds.size}, size from old: ${oldIds.size}, pagination: ${JSON.stringify(pagination)})`);
		}

		return resultsOld;
	}

	// See spec for complete documentation:
	// https://joplinapp.org/spec/server_delta_sync/#regarding-the-deletion-of-old-change-events
	public async compressOldChanges(ttl: number = null) {
		await this.oldModel_.compressOldChanges(ttl);
		await this.newModel_.compressOldChanges(ttl);
	}

	public async deleteByItemIds(itemIds: Uuid[]) {
		await this.oldModel_.deleteByItemIds(itemIds);
		await this.newModel_.deleteByItemIds(itemIds);
	}

	public async recordChange(options: RecordChangeOptions) {
		const change = await this.oldModel_.recordChange(options);
		await this.newModel_.recordChange({ ...options, changeId: change.id });
	}

}
