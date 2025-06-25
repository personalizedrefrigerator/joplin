import uuid, { createSecureRandom } from '@joplin/lib/uuid';
import JoplinServerApi from '@joplin/lib/JoplinServerApi';
import ClipperServer from '@joplin/lib/ClipperServer';
import { dirname, join } from 'path';
import { mkdir, remove } from 'fs-extra';
import { strict as assert } from 'assert';
import * as execa from 'execa';
import { msleep } from '@joplin/utils/time';
import Setting, { Env } from '@joplin/lib/models/Setting';
import Logger, { TargetType } from '@joplin/utils/Logger';
import { waitForCliInput } from '@joplin/utils/cli';
const { shimInit } = require('@joplin/lib/shim-init-node');

const globalLogger = new Logger();
globalLogger.addTarget(TargetType.Console);
Logger.initializeGlobalLogger(globalLogger);
const logger = Logger.create('fuzzer');

// See https://www.typescriptlang.org/play/?#example/recursive-type-references
type Json = string|number|Json[]|{ [key: string]: Json };

type HttpMethod = 'GET'|'POST'|'DELETE'|'PUT'|'PATCH';

interface FuzzContext {
	serverUrl: string;
	baseDir: string;
	execApi: (method: HttpMethod, route: string, debugAction: Json)=> Promise<Json>;
	actionTracker: ActionTracker;
}

interface UserData {
	email: string;
	password: string;
}


const getProperty = (object: unknown, propertyName: string) => {
	if (typeof object !== 'object') {
		throw new Error(`Cannot access property ${JSON.stringify(propertyName)} on non-object`);
	}

	if (!(propertyName in object)) {
		throw new Error(`No such property ${JSON.stringify(propertyName)} in object`);
	}

	return object[propertyName as keyof object];
};

const getStringProperty = (object: unknown, propertyName: string) => {
	const value = getProperty(object, propertyName);
	if (typeof value !== 'string') {
		throw new Error(`Property value is not a string (is ${typeof value})`);
	}
	return value;
};

const packagesDir = dirname(dirname(__dirname));
const cliDirectory = join(packagesDir, 'app-cli');

interface ActionableClient {
	createFolder(data: FolderMetadata): Promise<void>;
	deleteFolder(id: string): Promise<void>;
	createNote(data: NoteData): Promise<void>;
	shareFolder(id: string, shareWith: Client): Promise<void>;
	listNotes(): Promise<NoteData[]>;
	sync(): Promise<void>;
}

class Client implements ActionableClient {
	public readonly email: string;

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
		const userRoute = `api/users/${encodeURIComponent(serverId)}`;
		await context.execApi('PATCH', userRoute, {
			email,
			password,
			email_confirmed: 1,
		});

		const closeAccount = async () => {
			await context.execApi('DELETE', userRoute, {});
		};

		try {
			const userData = {
				email: getStringProperty(apiOutput, 'email'),
				password,
			};

			assert.equal(email, userData.email);

			const apiToken = createSecureRandom().replace(/[-]/g, '_');
			const apiPort = await ClipperServer.instance().findAvailablePort();

			const client = new Client(
				context.actionTracker.track({ email }),
				userData,
				profileDirectory,
				apiPort,
				apiToken,
				closeAccount,
			);

			// Joplin Server sync
			await client.execCliCommand('config', 'sync.target', '9');
			await client.execCliCommand('config', 'sync.9.path', context.serverUrl);
			await client.execCliCommand('config', 'sync.9.username', userData.email);
			await client.execCliCommand('config', 'sync.9.password', userData.password);
			await client.execCliCommand('config', 'api.token', apiToken);
			await client.execCliCommand('config', 'api.port', String(apiPort));

			const e2eePassword = createSecureRandom().replace(/^-/, '_');
			await client.execCliCommand('e2ee', 'enable', '--password', e2eePassword);
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
		} catch (error) {
			await closeAccount();
			throw error;
		}
	}

	private constructor(
		private readonly tracker_: ActionableClient,
		userData: UserData,
		private readonly profileDirectory: string,
		private readonly apiPort_: number,
		private readonly apiToken_: string,
		private readonly cleanUp_: ()=> Promise<void>,
	) {
		this.email = userData.email;
	}

	public async close() {
		await this.execCliCommand('server', 'stop');
		await this.cleanUp_();
	}

	private async execCliCommand(commandName: string, ...args: string[]) {
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
	private async execApiCommand(method: 'GET', route: string): Promise<Json>;
	// eslint-disable-next-line no-dupe-class-members -- This is not a duplicate class member
	private async execApiCommand(method: 'POST'|'PUT', route: string, data: Json): Promise<Json>;
	// eslint-disable-next-line no-dupe-class-members -- This is not a duplicate class member
	private async execApiCommand(method: HttpMethod, route: string, data: Json|null = null): Promise<Json> {
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

	private async decrypt() {
		const result = await this.execCliCommand('e2ee', 'decrypt');
		if (!result.stdout.includes('Completed decryption.')) {
			throw new Error(`Decryption did not complete: ${result.stdout}`);
		}
	}

	public async sync() {
		logger.info('Sync', this.email);

		await this.tracker_.sync();

		const result = await this.execCliCommand('sync');
		if (result.stdout.match(/Last error:/i)) {
			throw new Error(`Sync failed: ${result.stdout}`);
		}

		await this.decrypt();
	}

	public async createFolder(folder: FolderMetadata) {
		logger.info('Create folder', folder.id, 'in', this.email);
		await this.tracker_.createFolder(folder);

		await this.execApiCommand('POST', '/folders', {
			id: folder.id,
			title: folder.title,
			parent_id: folder.parentId ?? '',
		});
	}

	public async createNote(note: NoteData) {
		logger.info('Create note', note.id, 'in', this.email);
		await this.tracker_.createNote(note);

		await this.execApiCommand('POST', '/notes', {
			id: note.id,
			title: note.title,
			body: note.body,
			parent_id: note.parentId ?? '',
		});
		assert.equal(
			(await this.execCliCommand('cat', note.id)).stdout,
			`${note.title}\n\n${note.body}`,
			'note should exist',
		);
	}

	public async deleteFolder(id: string) {
		await this.tracker_.deleteFolder(id);

		await this.execCliCommand('rmbook', '--permanent', '--force', id);
	}

	public async shareFolder(id: string, shareWith: Client) {
		await this.tracker_.shareFolder(id, shareWith);

		logger.info('Share', id, 'with', shareWith.email);
		await this.execCliCommand('share', 'add', id, shareWith.email);
		await this.sync();
		await shareWith.sync();

		const shareWithIncoming = JSON.parse((await shareWith.execCliCommand('share', 'list', '--json')).stdout);
		const pendingInvitations = shareWithIncoming.invitations.filter((invitation: unknown) => {
			if (typeof invitation !== 'object' || !('accepted' in invitation)) {
				throw new Error('Invalid invitation format');
			}
			return !invitation.accepted;
		});
		assert.deepEqual(pendingInvitations, [
			{
				accepted: false,
				waiting: true,
				rejected: false,
				folderId: id,
				fromUser: {
					email: this.email,
				},
			},
		], 'there should be a single incoming share from the expected user');

		await shareWith.execCliCommand('share', 'accept', id);
	}

	public async listNotes() {
		const notes: NoteData[] = [];
		let page = 0;
		let hasMore = true;
		for (; hasMore; page++) {
			const pageQuery = page === 0 ? '' : `&page=${page}`;
			const fields = 'id,parent_id,body,title';
			const response = await this.execApiCommand(
				'GET', `/notes?fields=${fields}&include_deleted=1&limit=4${pageQuery}`,
			);
			if (
				typeof response !== 'object'
				|| !('has_more' in response)
				|| !('items' in response)
				|| !Array.isArray(response.items)
			) {
				throw new Error(`Invalid response: ${JSON.stringify(response)}`);
			}
			hasMore = !!response.has_more;

			for (const item of response.items) {
				notes.push({
					id: getStringProperty(item, 'id'),
					parentId: getStringProperty(item, 'parent_id'),
					title: getStringProperty(item, 'title'),
					body: getStringProperty(item, 'body'),
				});
			}
		}

		return notes;
	}

	public async checkState(_allClients: Client[]) {
		logger.info('Check state', this.email);

		const notes = [...await this.listNotes()];
		const expectedNotes = [...await this.tracker_.listNotes()];

		const compare = (a: NoteData, b: NoteData) => {
			if (a.id === b.id) return 0;
			return a.id < b.id ? -1 : 1;
		};
		notes.sort(compare);
		expectedNotes.sort(compare);

		assert.deepEqual(notes, expectedNotes);
	}
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
		checkState: async () => {
			for (const client of clientPool) {
				await client.checkState(clientPool);
			}
		},
	};
};

type ItemId = string;
type NoteData = { parentId: ItemId; id: ItemId; title: string; body: string };
type FolderMetadata = { parentId: ItemId; id: ItemId; title: string };
type FolderData = FolderMetadata & {
	childIds: ItemId[];
};
type TreeItem = NoteData|FolderData;

const isFolder = (item: TreeItem): item is FolderData => {
	return 'childIds' in item;
};

class ActionTracker {
	private idToItem_: Map<ItemId, TreeItem> = new Map();
	private tree_: Map<string, ItemId[]> = new Map();
	public constructor() {}

	private checkRep_() {
		const checkItem = (itemId: ItemId) => {
			const item = this.idToItem_.get(itemId);
			assert.ok(!!item, `should find item with ID ${itemId}`);

			if (item.parentId) {
				assert.ok(this.idToItem_.has(item.parentId), `should find parent (id: ${item.parentId})`);
			}

			if (isFolder(item)) {
				for (const childId of item.childIds) {
					checkItem(childId);
				}
			}
		};

		for (const childIds of this.tree_.keys()) {
			for (const childId of childIds) {
				assert.ok(this.idToItem_.has(childId), `root item ${childId} should exist`);

				const item = this.idToItem_.get(childId);
				assert.equal(item.parentId, '', `${childId} should not have a parent`);

				checkItem(childId);
			}
		}
	}

	public track(client: { email: string }) {
		const clientId = client.email;
		this.tree_.set(clientId, []);

		const getChildIds = (itemId: ItemId) => {
			const item = this.idToItem_.get(itemId);
			if (!item || !isFolder(item)) return [];
			return item.childIds;
		};
		const updateChildren = (parentId: ItemId, updateFn: (oldChildren: ItemId[])=> ItemId[]) => {
			const parent = this.idToItem_.get(parentId);
			if (!parent) throw new Error(`Parent with ID ${parentId} not found.`);
			if (!isFolder(parent)) throw new Error(`Item ${parentId} is not a folder`);

			this.idToItem_.set(parentId, {
				...parent,
				childIds: updateFn(parent.childIds),
			});
		};
		const addRootItem = (itemId: ItemId) => {
			this.tree_.set(clientId, [...this.tree_.get(clientId), itemId]);
		};
		const removeRootItem = (itemId: ItemId) => {
			let removed = false;
			// Check each client -- if shared, a root item can be present in multiple
			// clients:
			for (const [clientId, previous] of this.tree_) {
				if (previous.includes(itemId)) {
					this.tree_.set(clientId, previous.filter(otherId => otherId !== itemId));
					removed = true;
				}
			}

			if (!removed) {
				throw new Error(`Not a root item: ${itemId}`);
			}
		};
		const addChild = (parentId: ItemId, childId: ItemId) => {
			updateChildren(parentId, (oldChildren) => {
				if (oldChildren.includes(childId)) return oldChildren;
				return [...oldChildren, childId];
			});
		};
		const removeChild = (parentId: ItemId, childId: ItemId) => {
			updateChildren(parentId, (oldChildren) => {
				return oldChildren.filter(otherId => otherId !== childId);
			});
		};
		const removeItemRecursive = (id: ItemId) => {
			const item = this.idToItem_.get(id);
			if (!item) throw new Error(`Item with ID ${id} not found.`);

			if (item.parentId) {
				removeChild(item.parentId, item.id);
			} else {

				removeRootItem(item.id);
			}

			if (isFolder(item)) {
				for (const childId of item.childIds) {
					const child = this.idToItem_.get(childId);
					assert.equal(child?.parentId, id, `child ${childId} should have accurate parent ID`);

					removeItemRecursive(childId);
				}
			}

			this.idToItem_.delete(id);
		};
		const mapItems = <T> (map: (item: TreeItem)=> T) => {
			const workList: ItemId[] = [...this.tree_.get(clientId)];
			const result: T[] = [];

			while (workList.length > 0) {
				const id = workList.pop();
				const item = this.idToItem_.get(id);
				if (!item) throw new Error(`Not found: ${id}`);

				result.push(map(item));

				if (isFolder(item)) {
					for (const childId of item.childIds) {
						workList.push(childId);
					}
				}
			}

			return result;
		};

		const tracker: ActionableClient = {
			createNote: (data: NoteData) => {
				this.idToItem_.set(data.id, {
					...data,
				});
				assert.ok(!!data.parentId, `note ${data.id} should have a parentId`);
				addChild(data.parentId, data.id);

				this.checkRep_();
				return Promise.resolve();
			},
			createFolder: (data: FolderMetadata) => {
				this.idToItem_.set(data.id, {
					...data,
					parentId: data.parentId ?? '',
					childIds: getChildIds(data.id),
				});
				if (data.parentId) {
					addChild(data.parentId, data.id);
				} else {
					addRootItem(data.id);
				}

				this.checkRep_();
				return Promise.resolve();
			},
			deleteFolder: (id: ItemId) => {
				this.checkRep_();

				const item = this.idToItem_.get(id);
				if (!item) throw new Error(`Not found ${id}`);
				if (!isFolder(item)) throw new Error(`Not a folder ${id}`);

				removeItemRecursive(id);

				this.checkRep_();
				return Promise.resolve();
			},
			shareFolder: (id: ItemId, shareWith: Client) => {
				const otherFolders = this.tree_.get(shareWith.email);
				if (otherFolders.includes(id)) {
					throw new Error(`Folder ${id} already shared with ${shareWith.email}`);
				}
				this.tree_.set(shareWith.email, [...otherFolders, id]);

				this.checkRep_();
				return Promise.resolve();
			},
			sync: () => Promise.resolve(),
			listNotes: () => {
				const notes = mapItems(item => {
					return isFolder(item) ? null : item;
				}).filter(item => !!item);

				this.checkRep_();
				return Promise.resolve(notes);
			},
		};
		return tracker;
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
			logger.info('Closed the server.');
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

	const cleanUp = async () => {
		while (cleanupTasks.length) {
			const task = cleanupTasks.pop();
			await task();
		}
	};

	// Run cleanup on Ctrl-C
	process.on('SIGINT', async () => {
		logger.info('Intercepted ctrl-c. Cleaning up...');
		await cleanUp();
		process.exit(1);
	});

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
			actionTracker: new ActionTracker(),
		};
		const clientPool = await createClientPool(
			fuzzContext,
			3,
			task => { cleanupTasks.push(task); },
		);

		for (let i = 0; i < 3; i++) {
			const client = clientPool.randomClient();
			const actionTracker = client;
			const folder1Id = uuid.create();
			await actionTracker.createFolder({
				parentId: null,
				id: folder1Id,
				title: 'Test.',
			});
			await actionTracker.createFolder({
				parentId: folder1Id,
				id: uuid.create(),
				title: 'Test...',
			});
			await actionTracker.createNote({
				parentId: folder1Id,
				title: `Test (x${i})`,
				body: 'Testing...',
				id: uuid.create(),
			});
			await actionTracker.sync();
			await clientPool.checkState();

			const other = clientPool.clients[0];
			if (other !== client) {
				await actionTracker.shareFolder(folder1Id, other);
				await actionTracker.sync();
				await other.sync();
				await clientPool.checkState();
			}

			await actionTracker.deleteFolder(folder1Id);
			await actionTracker.sync();
		}
	} catch (error) {
		logger.error('ERROR', error);
		logger.info('An error occurred. Pausing before continuing cleanup.');
		await waitForCliInput();
		process.exitCode = 1;
	} finally {
		await cleanUp();

		logger.info('Cleanup complete');
		process.exit();
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
