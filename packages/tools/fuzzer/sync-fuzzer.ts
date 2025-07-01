import uuid from '@joplin/lib/uuid';
import { join } from 'path';
import { mkdir, remove } from 'fs-extra';
import Setting, { Env } from '@joplin/lib/models/Setting';
import Logger, { TargetType } from '@joplin/utils/Logger';
import { waitForCliInput } from '@joplin/utils/cli';
import Server from './Server';
import { CleanupTask, FuzzContext } from './types';
import ClientPool from './ClientPool';
import retryWithCount from './utils/retryWithCount';
import Client from './Client';
import SeededRandom from './utils/SeededRandom';
import { env } from 'process';
import yargs = require('yargs');
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

const doRandomAction = async (context: FuzzContext, client: Client, clientPool: ClientPool) => {
	const selectOrCreateParentFolder = async () => {
		let parentId = (await client.randomFolder({}))?.id;

		// Create a toplevel folder to serve as this
		// folder's parent if none exist yet
		if (!parentId) {
			parentId = uuid.create();
			await client.createFolder({
				parentId: '',
				id: parentId,
				title: 'Parent folder',
			});
		}

		return parentId;
	};

	const actions = {
		newSubfolder: async () => {
			const folderId = uuid.create();
			const parentId = await selectOrCreateParentFolder();

			await client.createFolder({
				parentId: parentId,
				id: folderId,
				title: 'Subfolder',
			});

			return true;
		},
		newToplevelFolder: async () => {
			const folderId = uuid.create();
			await client.createFolder({
				parentId: null,
				id: folderId,
				title: `Folder ${context.randInt(0, 1000)}`,
			});

			return true;
		},
		newNote: async () => {
			const parentId = await selectOrCreateParentFolder();
			await client.createNote({
				parentId: parentId,
				title: `Test (x${context.randInt(0, 1000)})`,
				body: 'Testing...',
				id: uuid.create(),
			});

			return true;
		},
		shareFolder: async () => {
			const target = await client.randomFolder({
				filter: candidate => (
					!candidate.parentId && !candidate.isShareRoot
				),
			});
			if (!target) return false;

			const other = clientPool.randomClient(c => c !== client);
			await client.shareFolder(target.id, other);
			return true;
		},
		deleteFolder: async () => {
			const target = await client.randomFolder({});
			if (!target) return false;

			await client.deleteFolder(target.id);
			return true;
		},
		moveFolderToToplevel: async () => {
			const target = await client.randomFolder({
				// Don't choose items that are already toplevel
				filter: item => !!item.parentId,
			});
			if (!target) return false;

			await client.moveItem(target.id, '');
			return true;
		},
	};

	const actionKeys = [...Object.keys(actions)] as (keyof typeof actions)[];

	let result = false;
	while (!result) { // Loop until an action was done
		const randomAction = actionKeys[context.randInt(0, actionKeys.length)];
		logger.info(`Action: ${randomAction} in ${client.email}`);
		result = await actions[randomAction]();
		if (!result) {
			logger.info(`  ${randomAction} was skipped.`);
		}
	}
};

interface Options {
	seed: number;
}

const main = async (options: Options) => {
	shimInit();
	Setting.setConstant('env', Env.Dev);

	const cleanupTasks: CleanupTask[] = [];

	const cleanUp = async () => {
		while (cleanupTasks.length) {
			const task = cleanupTasks.pop();
			try {
				await task();
			} catch (error) {
				logger.warn('Clean up task failed:', error);
			}
		}
	};

	// Run cleanup on Ctrl-C
	process.on('SIGINT', async () => {
		logger.info('Intercepted ctrl-c. Cleaning up...');
		await cleanUp();
		process.exit(1);
	});

	let clientHelpText;

	try {
		const joplinServerUrl = 'http://localhost:22300/';
		const server = new Server(joplinServerUrl, {
			email: 'admin@localhost',
			password: env['FUZZER_SERVER_ADMIN_PASSWORD'] ?? 'admin',
		});
		cleanupTasks.push(() => server.close());

		if (!await server.checkConnection()) {
			throw new Error('Could not connect to the server.');
		}

		const profilesDirectory = await createProfilesDirectory();
		cleanupTasks.push(profilesDirectory.remove);

		logger.info('Starting with seed', options.seed);
		const random = new SeededRandom(options.seed);

		const fuzzContext: FuzzContext = {
			serverUrl: joplinServerUrl,
			baseDir: profilesDirectory.path,
			execApi: server.execApi.bind(server),
			randInt: (a, b) => random.nextInRange(a, b),
		};
		const clientPool = await ClientPool.create(
			fuzzContext,
			3,
			task => { cleanupTasks.push(task); },
		);
		clientHelpText = clientPool.helpText();

		const maxSteps = 50;
		for (let i = 1; i <= maxSteps; i++) {
			const client = clientPool.randomClient();

			logger.info('Step', i, '/', maxSteps);
			await doRandomAction(fuzzContext, client, clientPool);
			await client.sync();

			// .checkState can fail occasionally due to incomplete
			// syncs (perhaps because the server is still processing
			// share-related changes?). Allow this to be retried:
			await retryWithCount(async () => {
				await clientPool.checkState();
			}, {
				count: 3,
				onFail: async () => {
					logger.info('.checkState failed. Syncing all clients...');
					await clientPool.syncAll();
				},
			});
		}
	} catch (error) {
		logger.error('ERROR', error);
		if (clientHelpText) {
			logger.info('Client information:\n', clientHelpText);
		}
		logger.info('An error occurred. Pausing before continuing cleanup.');
		await waitForCliInput();
		process.exitCode = 1;
	} finally {
		await cleanUp();

		logger.info('Cleanup complete');
		process.exit();
	}
};


void yargs
	.usage('$0 <cmd>')
	.command(
		'start',
		'Starts the fuzzer. Use FUZZER_SERVER_ADMIN_PASSWORD to specify the admin@localhost password for Joplin Server.',
		(yargs) => {
			return yargs.options({
				'seed': { type: 'number', default: 12345 },
			});
		},
		async (argv) => {
			await main({ seed: argv.seed });
		},
	)
	.help()
	.argv;
