import uuid, { createSecureRandom } from '@joplin/lib/uuid';
import JoplinServerApi from '@joplin/lib/JoplinServerApi';
import ClipperServer from '@joplin/lib/ClipperServer';
import { dirname, join } from 'path';
import { mkdir, remove } from 'fs-extra';
import * as assert from 'assert';
import * as execa from 'execa';
import { msleep } from '@joplin/utils/time';
import Setting, { Env } from '@joplin/lib/models/Setting';
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

interface ActionableClient {
	createFolder(data: FolderMetadata, parent?: string|null): Promise<void>;
	sync(): Promise<void>;
}

class Client implements ActionableClient {
	public readonly actionTracker = new ActionTracker(this);

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

		const apiToken = createSecureRandom();
		const apiPort = await ClipperServer.instance().findAvailablePort();

		const client = new Client(
			profileDirectory,
			apiPort,
			apiToken,
		);

		// Joplin Server sync
		await client.execCliCommand('config', 'sync.target', '9');
		await client.execCliCommand('config', 'sync.9.path', context.serverUrl);
		await client.execCliCommand('config', 'sync.9.username', userData.email);
		await client.execCliCommand('config', 'sync.9.password', userData.password);
		await client.execCliCommand('config', 'api.token', apiToken);
		await client.execCliCommand('config', 'api.port', String(apiPort));
		logger.info('Created and configured client');

		// Run asynchronously -- the API server command doesn't exit until the server
		// is closed.
		void (async () => {
			try {
				await client.execCliCommand('server', 'start');
			} catch (error) {
				logger.info('API server exited');
				logger.debug('API server exit status', error);
			}
		})();

		await client.sync();
		return client;
	}

	private constructor(
		private readonly profileDirectory: string,
		private readonly apiPort_: number,
		private readonly apiToken_: string,
	) { }

	public async close() {
		await this.execCliCommand('server', 'stop');
	}

	public async execCliCommand(commandName: string, ...args: string[]) {
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

	// eslint-disable-next-line no-dupe-class-members -- This is not a duplicate class member
	public async execApiCommand(method: 'GET', route: string): Promise<Json>;
	// eslint-disable-next-line no-dupe-class-members -- This is not a duplicate class member
	public async execApiCommand(method: 'POST'|'PUT', route: string, data: Json): Promise<Json>;
	// eslint-disable-next-line no-dupe-class-members -- This is not a duplicate class member
	public async execApiCommand(method: HttpMethod, route: string, data: Json|null = null): Promise<Json> {
		route = route.replace(/^[/]/, '');
		const url = new URL(`http://localhost:${this.apiPort_}/${route}`);
		url.searchParams.append('token', this.apiToken_);

		const response = await fetch(url, {
			method,
			body: data ? JSON.stringify(data) : undefined,
		});

		if (!response.ok) {
			throw new Error(`Request to ${route} failed with error: ${await response.text()}`);
		}

		return await response.json();
	}

	public async sync() {
		const result = await this.execCliCommand('sync');
		if (result.stdout.match(/Last error:/i)) {
			throw new Error(`Sync failed: ${result.stdout}`);
		}
	}

	public async createFolder(folder: FolderMetadata, parentId: string|null) {
		await this.execApiCommand('POST', '/folders', {
			id: folder.id,
			title: folder.title,
			parent_id: parentId ?? '',
		});
	}

	public async trashFolder(idOrTitle: string) {
		await this.execCliCommand('rmbook', '--force', idOrTitle);
	}

	public async permanentDeleteFolder(idOrTitle: string) {
		await this.execCliCommand('rmbook', '--permanent', '--force', idOrTitle);
	}

//	public async shareFolder(id: string, shareWith: Client) {
//		TODO(id, shareWith);
//	}
//
//	public async unshareFolder(id: string) {
//		TODO(id);
//	}
}

type CleanupTask = ()=> Promise<void>;
const createClientPool = async (
	context: FuzzContext,
	clientCount: number,
	addCleanupTask: (task: CleanupTask)=> void,
) => {
	const clientPool: Client[] = [];
	for (let i = 0; i < clientCount; i++) {
		const client = await Client.create(context);
		addCleanupTask(() => client.close());
		clientPool.push(client);
	}

	return {
		clients: clientPool,
		randomClient: () => {
			return clientPool[Math.floor(Math.random() * clientPool.length)];
		},
	};
};

type NoteData = { id: string; title: string; body: string };
type FolderMetadata = { id: string; title: string; sharedWith: string[] };
type FolderData = FolderMetadata & {
	children: (NoteData|FolderData)[];
};

class ActionTracker implements ActionableClient {
	private tree_: FolderData[] = [];
	public constructor(private target_: ActionableClient) {}

	private reduceTree_<T>(
		reducer: (current: FolderData|NoteData, last: T)=> T,
		initial: T,
	) {
		const reduceTree = (tree: (FolderData|NoteData)[], initial: T) => {
			let result: T = initial;
			for (const item of tree) {
				result = reducer(item, result);

				if ('children' in item) {
					result = reduceTree(item.children, result);
				}
			}
			return result;
		};
		return reduceTree(this.tree_, initial);
	}

	private findFolder_(titleOrId: string) {
		return this.reduceTree_<FolderData>((item, match) => {
			if (match) return match;

			const matchingTitleOrId = item.title === titleOrId || item.id === titleOrId;
			if (matchingTitleOrId && 'children' in item) {
				return item;
			}

			return null;
		}, null);
	}

	public async createFolder(data: FolderMetadata, parent?: string | null): Promise<void> {
		logger.info('Create folder', data.title);
		await this.target_.createFolder(data, parent);

		const modelParent = parent && this.findFolder_(parent);

		const newFolder: FolderData = {
			...data,
			children: [],
			sharedWith: [...data.sharedWith],
		};
		if (modelParent) {
			modelParent.children.push(newFolder);
		} else {
			this.tree_.push(newFolder);
		}
	}

	public async sync() {
		logger.info('Sync');
		await this.target_.sync();
	}

}

const startServer = async (serverUrl: string, adminAuth: UserData) => {
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

	const createApi = async () => {
		const api = new JoplinServerApi({
			baseUrl: () => serverUrl,
			userContentBaseUrl: () => serverUrl,
			password: () => adminAuth.password,
			username: () => adminAuth.email,
			session: ()=>null,
			env: Env.Dev,
		});
		await api.loadSession();
		return api;
	};
	let api: JoplinServerApi|null = null;

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
		execApi: async (method: HttpMethod, route: string, action: Json) => {
			api ??= await createApi();
			logger.debug('API EXEC', method, route, action);
			const result = await api.exec(method, route, {}, action);
			return result;
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
	Setting.setConstant('env', Env.Dev);

	const cleanupTasks: CleanupTask[] = [];
	try {
		const joplinServerUrl = 'http://localhost:22300/';
		const server = await startServer(joplinServerUrl, {
			email: 'admin@localhost',
			// TODO: Admin password from an environment variable?
			password: 'admin',
		});
		cleanupTasks.push(() => server.close());

		if (!await server.checkConnection()) {
			throw new Error('Could not connect to the server.');
		}

		const profilesDirectory = await createProfilesDirectory();
		cleanupTasks.push(profilesDirectory.remove);

		const fuzzContext: FuzzContext = {
			serverUrl: joplinServerUrl,
			baseDir: profilesDirectory.path,
			execApi: server.execApi,
		};
		const clientPool = await createClientPool(
			fuzzContext,
			3,
			task => { cleanupTasks.push(task); },
		);

		for (let i = 0; i < 3; i++) {
			const client = clientPool.randomClient();
			const folder1Id = uuid.create();
			await client.actionTracker.createFolder({
				id: folder1Id,
				title: 'Test.',
				sharedWith: [],
			}, null);
			await client.actionTracker.createFolder({
				id: uuid.create(),
				title: 'Test...',
				sharedWith: [],
			}, folder1Id);
			await client.actionTracker.sync();
		}
	} catch (error) {
		logger.error(error);
	} finally {
		// Clean up more recent items first -- later items may depend on earlier
		// items.
		cleanupTasks.reverse();
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
