import { openDatabaseAsync, SQLiteDatabase } from 'expo-sqlite';
import { safeFilename } from '@joplin/utils/path';

export default class DatabaseDriverReactNative {
	private lastInsertId_: number;
	private db_: SQLiteDatabase;
	public constructor() {
		this.lastInsertId_ = null;
	}

	public async open(options: { name: string }) {
		this.db_ = await openDatabaseAsync(safeFilename(options.name));
	}

	public sqliteErrorToJsError(error: Error) {
		return error;
	}

	private async exec_(sql: string, params: string[] = []) {
		const statement = await this.db_.prepareAsync(sql);
		const result = await statement.executeAsync(...params);
		await statement.finalizeAsync();
		if (result.lastInsertRowId) {
			this.lastInsertId_ = result.lastInsertRowId;
		}
		return result;
	}

	public async selectOne(sql: string, params: string[] = []) {
		const items = await this.exec_(sql, params);
		return items.getFirstAsync();
	}

	public async selectAll(sql: string, params: string[] = null) {
		const items = await this.exec_(sql, params);
		return items.getAllAsync();
	}

	public loadExtension(path: string) {
		throw new Error(`No extension support for ${path} in sqlite wasm`);
	}

	public async exec(sql: string, params: string[]|null = null) {
		return this.exec_(sql, params);
	}

	public lastInsertId() {
		return this.lastInsertId_;
	}
}
