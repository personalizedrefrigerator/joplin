import { join, resolve } from 'path';
import { HttpMethod, Json, UserData } from '../types';
import JoplinServerApi from '@joplin/lib/JoplinServerApi';
import { Env } from '@joplin/lib/models/Setting';
import execa = require('execa');
import { msleep } from '@joplin/utils/time';
import Logger from '@joplin/utils/Logger';
import { strict as assert } from 'assert';
import { copy, exists } from 'fs-extra';
import { copyFile } from 'fs/promises';

const logger = Logger.create('Server');

const createApi = async (serverUrl: string, adminAuth: UserData) => {
	const api = new JoplinServerApi({
		baseUrl: () => serverUrl,
		userContentBaseUrl: () => serverUrl,
		password: () => adminAuth.password,
		username: () => adminAuth.email,
		session: ()=>null,
		apiKey: ()=>'',
		env: Env.Dev,
	});
	await api.loadSession();
	return api;
};

interface FromSnapshotOptions {
	snapshotDirectory: string;

	serverBaseDirectory: string;
	serverUrl: string;
	adminAuth: UserData;
}

export default class Server {
	private api_: JoplinServerApi|null = null;
	private server_: execa.ExecaChildProcess<string>;
	private baseDirectory_: string;

	public constructor(
		serverBaseDirectory: string,
		private readonly serverUrl_: string,
		private readonly adminAuth_: UserData,
	) {
		const serverDir = resolve(serverBaseDirectory);
		this.baseDirectory_ = serverDir;
		const mainEntrypoint = join(serverDir, 'dist', 'app.js');
		this.server_ = execa.node(mainEntrypoint, [
			'--env', 'dev',
		], {
			env: {
				JOPLIN_IS_TESTING: '1',
			},
			cwd: serverDir,
			stdin: 'ignore', // No stdin
			// For debugging:
			stderr: process.stderr,
			// stdout: process.stdout,
		});
	}

	public static async fromSnapshot({
		serverBaseDirectory, snapshotDirectory, adminAuth, serverUrl,
	}: FromSnapshotOptions) {
		const serverDatabaseFile = join(serverBaseDirectory, 'db-dev.sqlite');
		// TODO: Use SQLITE_DATABASE instead of resetting the db-dev.sqlite file?
		logger.info('Overwriting', serverDatabaseFile, '... (restoring to snapshot...)');
		await copy(join(snapshotDirectory, 'server', 'db-dev.sqlite'), serverDatabaseFile);

		return new Server(
			serverBaseDirectory, serverUrl, adminAuth,
		);
	}

	public async saveSnapshot(outputDirectory: string) {
		// Note: Assumes that the server is using SQLite!
		const databasePath = join(this.baseDirectory_, 'db-dev.sqlite');
		logger.info('Creating snapshot:', databasePath, '...');

		assert.ok(await exists(outputDirectory));
		const destination = join(outputDirectory, 'db-dev.sqlite');
		await copyFile(databasePath, destination);
	}

	public get url() {
		return this.serverUrl_;
	}

	public async checkConnection() {
		let lastError;
		for (let retry = 0; retry < 30; retry++) {
			try {
				const response = await fetch(`${this.serverUrl_}api/ping`);
				if (response.ok) {
					return true;
				}
			} catch (error) {
				lastError = error;
			}
			await msleep(500);
		}
		if (lastError) {
			throw lastError;
		}
		return false;
	}

	public async execApi(method: HttpMethod, route: string, action: Json|undefined): Promise<Json> {
		this.api_ ??= await createApi(this.serverUrl_, this.adminAuth_);
		logger.debug('API EXEC', method, route, action);
		const result = await this.api_.exec(method, route, {}, action);
		return result;
	}

	public async close() {
		this.server_.cancel();
		logger.info('Closed the server.');
	}
}


