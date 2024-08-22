import BaseModel, { ModelType } from '../BaseModel';
import { SqlQuery } from '../services/database/types';
import Database from '../database';

export type MirrorJournalData = {
	item_id: string;
	mirror_id: string;
	hash_md5: string;
	path: string;
};

export default class MirrorJournalEntry extends BaseModel {

	public static tableName() {
		return 'folder_mirror_journal';
	}

	public static modelType() {
		return ModelType.FolderMirrorJournal;
	}

	public static async allForMirror(mirrorId: string): Promise<MirrorJournalData[]> {
		return await this.modelSelectAll({
			sql: `SELECT * from ${this.tableName()} WHERE mirror_id = ?`,
			params: [mirrorId],
		});
	}

	private static deleteSql(mirrorId: string): SqlQuery {
		return {
			sql: `DELETE FROM ${this.tableName()} WHERE mirror_id = ?`,
			params: [mirrorId],
		};
	}

	public static async deleteMirror(mirrorId: string) {
		await this.db().exec(this.deleteSql(mirrorId));
	}

	public static async updateMirrorTree(mirrorId: string, treeData: Omit<MirrorJournalData, 'mirror_id'>[]) {
		const sql: (string|SqlQuery)[] = [];
		// 1. Delete the mirror journal
		sql.push(this.deleteSql(mirrorId));

		// 2. Write all treeData
		for (const item of treeData) {
			sql.push(Database.insertQuery(this.tableName(), item));
		}

		await this.db().transactionExecBatch(sql);
	}
}
