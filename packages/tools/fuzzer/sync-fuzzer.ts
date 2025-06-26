import uuid from '@joplin/lib/uuid';
import { join } from 'path';
import { mkdir, remove } from 'fs-extra';
import Setting, { Env } from '@joplin/lib/models/Setting';
import Logger, { TargetType } from '@joplin/utils/Logger';
import { waitForCliInput } from '@joplin/utils/cli';
import Server from './Server';
import { CleanupTask, FuzzContext } from './types';
import ClientPool from './ClientPool';
const { shimInit } = require('@joplin/lib/shim-init-node');

const globalLogger = new Logger();
globalLogger.addTarget(TargetType.Console);
Logger.initializeGlobalLogger(globalLogger);
const logger = Logger.create('fuzzer');

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
		const server = new Server(joplinServerUrl, {
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
			execApi: server.execApi.bind(server),
			randInt: (a, b) => Math.floor((a - b) * Math.random() + b),
		};
		const clientPool = await ClientPool.create(
			fuzzContext,
			3,
			task => { cleanupTasks.push(task); },
		);

		const sharedFolders = new Set<string>();

		for (let i = 0; i < 20; i++) {
			const client = clientPool.randomClient();

			const actions = {
				newSubfolder: async () => {
					const folderId = uuid.create();
					const parent = await client.randomFolder({});
					await client.createFolder({
						parentId: parent?.id ?? null,
						id: folderId,
						title: 'Some title',
					});
				},
				newToplevelFolder: async () => {
					const folderId = uuid.create();
					await client.createFolder({
						parentId: null,
						id: folderId,
						title: `Folder ${i}`,
					});
				},
				newNote: async () => {
					let parentId = (await client.randomFolder({}))?.id;

					// Handles the case where no parent folder exists
					if (!parentId) {
						parentId = uuid.create();
						await client.createFolder({
							parentId: null,
							id: parentId,
							title: 'Test folder',
						});
					}

					await client.createNote({
						parentId: parentId,
						title: `Test (x${i})`,
						body: 'Testing...',
						id: uuid.create(),
					});
				},
				shareFolder: async () => {
					const target = await client.randomFolder({
						filter: candidate => (
							!candidate.parentId && !sharedFolders.has(candidate.id)
						),
					});

					if (target) {
						const other = clientPool.randomClient(c => c !== client);
						await client.shareFolder(target.id, other);
						sharedFolders.add(target.id);
					}
				},
				deleteFolder: async () => {
					const target = await client.randomFolder({});
					if (target) {
						await client.deleteFolder(target.id);
					}
				},
			};

			const actionKeys = [...Object.keys(actions)] as (keyof typeof actions)[];
			const randomAction = actionKeys[fuzzContext.randInt(0, actionKeys.length)];

			logger.info(`Action ${i}: ${randomAction}`);
			await actions[randomAction]();

			await client.sync();
			await clientPool.syncAll();
			await clientPool.checkState();
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
};

void main();
