import uuid, { createSecureRandom } from '@joplin/lib/uuid';
import JoplinServerApi from '@joplin/lib/JoplinServerApi';
import { dirname, join } from 'path';
import { mkdir, remove } from 'fs-extra';
import * as assert from 'assert';
import * as execa from 'execa';
import { msleep } from '@joplin/utils/time';
import { Env } from '@joplin/lib/models/Setting';
import Logger, { TargetType } from '@joplin/utils/Logger';
const { shimInit } = require('@joplin/lib/shim-init-node');

const globalLogger = new Logger();
globalLogger.addTarget(TargetType.Console);
Logger.initializeGlobalLogger(globalLogger);
const logger = Logger.create('fuzzer');

// See https://www.typescriptlang.org/play/?#example/recursive-type-references
type Json = string|number|Json[]|{ [key: string]: Json };

type HttpMethod = 'GET'|'POST'|'PUT'|'PATCH';

interface FuzzContext {
	serverUrl: string;
	baseDir: string;
	execApi: (method: HttpMethod, route: string, debugAction: Json)=> Promise<Json>;
}

interface UserData {
	email: string;
	password: string;
}

const getStringProperty = (object: unknown, propertyName: string) => {
	if (typeof object !== 'object') {
		throw new Error(`Cannot access property ${JSON.stringify(propertyName)} on non-object`);
	}

	if (!(propertyName in object)) {
		throw new Error(`No such property ${JSON.stringify(propertyName)} in object`);
	}

	const value = object[propertyName as keyof object];

	if (typeof value !== 'string') {
		throw new Error('Property value is not a string');
	}

	return value;
};

const packagesDir = dirname(dirname(__dirname));
const cliDirectory = join(packagesDir, 'app-cli');

class Client {
	public static async create(context: FuzzContext) {
		const id = uuid.create();
		const profileDirectory = join(context.baseDir, id);
		await mkdir(profileDirectory);

		const email = `${id}@localhost`;
		const password = createSecureRandom();
		const apiOutput = await context.execApi('POST', 'api/users', {
			email,
		});
		const serverId = getStringProperty(apiOutput, 'id');

		// The password needs to be set *after* creating the user.
		await context.execApi('PATCH', `api/users/${encodeURIComponent(serverId)}`, {
			email,
			password,
		});

		const userData = {
			email: getStringProperty(apiOutput, 'email'),
			password,
		};

		assert.equal(email, userData.email);

		const client = new Client(
			profileDirectory,
			userData,
		);

		// Joplin Server sync
		await client.execCommand('config', 'sync.target', '9');
		await client.execCommand('config', 'sync.9.path', context.serverUrl);
		await client.execCommand('config', 'sync.9.username', userData.email);
		await client.execCommand('config', 'sync.9.password', userData.password);
		logger.info('Created and configured client');

		await client.sync();
		return client;
	}

	private constructor(
		public profileDirectory: string,
		public userData: UserData,
	) { }

	public async execCommand(commandName: string, ...args: string[]) {
		assert.match(commandName, /^[a-z]/, 'Command name must start with a lowercase letter.');
		const commandResult = await execa('yarn', [
			'run', 'start-no-build',
			'--profile', this.profileDirectory,
			'--env', 'dev',
			commandName,
			...args,
		], { cwd: cliDirectory });
		logger.debug('Ran command: ', commandResult.command, commandResult.exitCode);
		logger.debug('     Output: ', commandResult.stdout);
		return commandResult;
	}

	public async sync() {
		const result = await this.execCommand('sync');
		if (result.stdout.match(/Last error:/i)) {
			throw new Error(`Sync failed: ${result.stdout}`);
		}
	}

	public async createFolder(parentId: string|null, title: string) {
		const options = parentId ? ['--parent', parentId] : [];
		await this.execCommand('mkbook', ...options, title);
	}

	public async trashFolder(idOrTitle: string) {
		await this.execCommand('rmbook', '--force', idOrTitle);
	}

	public async permanentDeleteFolder(idOrTitle: string) {
		await this.execCommand('rmbook', '--permanent', '--force', idOrTitle);
	}

//	public async shareFolder(id: string, shareWith: Client) {
//		TODO(id, shareWith);
//	}
//
//	public async unshareFolder(id: string) {
//		TODO(id);
//	}
}

const startServer = async (serverUrl: string) => {
	const serverDir = join(packagesDir, 'server');
	const mainEntrypoint = join(serverDir, 'dist', 'app.js');
	const server = execa.node(mainEntrypoint, [
		'--env', 'dev',
	], {
		env: { JOPLIN_IS_TESTING: '1' },
		cwd: join(packagesDir, 'server'),
		// For debugging:
		// stderr: process.stderr,
		// stdout: process.stdout,
	});

	return {
		async checkConnection() {
			let lastError;
			for (let retry = 0; retry < 30; retry++) {
				try {
					const response = await fetch(`${serverUrl}api/ping`);
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
		},
		createApi: async (userName: string, password: string) => {
			const api = new JoplinServerApi({
				baseUrl: () => serverUrl,
				userContentBaseUrl: () => serverUrl,
				password: () => password,
				username: () => userName,
				session: ()=>null,
				env: Env.Dev,
			});
			await api.loadSession();
			return api;
		},
		close: async () => {
			server.cancel();
		},
	};
};

const createProfilesDirectory = async () => {
	const path = join(__dirname, 'profiles-tmp');
	await mkdir(path);
	return {
		path,
		remove: async () => {
			await remove(path);
		},
	};
};

const main = async () => {
	shimInit();

	const cleanupTasks: (()=> Promise<void>)[] = [];
	try {
		const joplinServerUrl = 'http://localhost:22300/';
		const server = await startServer(joplinServerUrl);
		cleanupTasks.push(() => server.close());

		if (!await server.checkConnection()) {
			throw new Error('Could not connect to the server.');
		}
		// TODO: Admin password from an environment variable?
		const api = await server.createApi('admin@localhost', 'admin');

		const profilesDirectory = await createProfilesDirectory();
		cleanupTasks.push(profilesDirectory.remove);

		const clientPool: Client[] = [];
		const fuzzContext: FuzzContext = {
			serverUrl: joplinServerUrl,
			baseDir: profilesDirectory.path,
			execApi: async (method: HttpMethod, route: string, action: Json) => {
				logger.debug('API EXEC', method, route, action);
				const result = await api.exec(method, route, {}, action);
				return result;
			},
		};
		for (let i = 0; i < 3; i++) {
			clientPool.push(await Client.create(fuzzContext));
		}
	} catch (error) {
		logger.error(error);
	} finally {
		for (const task of cleanupTasks) {
			await task();
		}
	}
//	const randomClient = () => clientPool[Math.floor(Math.random() * clientPool.length)];
//
//	const maxActions = Math.ceil(Math.random() * 100);
//	for (let i = 0; i < maxActions; i++) {
//		const action = randomAction();
//		const client = randomClient();
//		client.applyAction(action);
//		client.checkRep();
//	}
};

void main();
