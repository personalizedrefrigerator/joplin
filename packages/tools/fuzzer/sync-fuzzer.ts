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
		};
		const clientPool = await ClientPool.create(
			fuzzContext,
			3,
			task => { cleanupTasks.push(task); },
		);

		for (let i = 0; i < 3; i++) {
			const client = clientPool.randomClient();
			const folder1Id = uuid.create();
			await client.createFolder({
				parentId: null,
				id: folder1Id,
				title: 'Test.',
			});
			await client.createFolder({
				parentId: folder1Id,
				id: uuid.create(),
				title: 'Test...',
			});
			await client.createNote({
				parentId: folder1Id,
				title: `Test (x${i})`,
				body: 'Testing...',
				id: uuid.create(),
			});
			await client.sync();
			await clientPool.checkState();

			const other = clientPool.clients[0];
			if (other !== client) {
				await client.shareFolder(folder1Id, other);
				await client.sync();
				await other.sync();
				await clientPool.checkState();
			}

			await client.deleteFolder(folder1Id);
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
