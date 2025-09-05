import { join } from 'path';
import { exists, mkdir, remove } from 'fs-extra';
import Setting, { Env } from '@joplin/lib/models/Setting';
import Logger, { TargetType } from '@joplin/utils/Logger';
import Server from './Server';
import { CleanupTask, FuzzContext } from './types';
import ClientPool from './ClientPool';
import retryWithCount from './utils/retryWithCount';
import SeededRandom from './utils/SeededRandom';
import { env } from 'process';
import yargs = require('yargs');
import openDebugSession from './utils/openDebugSession';
import { Second } from '@joplin/utils/time';
import { packagesDir } from './constants';
import doRandomAction from './doRandomAction';
const { shimInit } = require('@joplin/lib/shim-init-node');

const globalLogger = new Logger();
globalLogger.addTarget(TargetType.Console);
Logger.initializeGlobalLogger(globalLogger);
const logger = Logger.create('fuzzer');

const createProfilesDirectory = async () => {
	const path = join(__dirname, 'profiles-tmp');
	if (await exists(path)) {
		throw new Error([
			'Another instance of the sync fuzzer may be running!',
			'The parent directory for test profiles already exists. An instance of the fuzzer is either already running or was closed before it could clean up.',
			`To ignore this issue, delete ${JSON.stringify(path)} and re-run the fuzzer.`,
		].join('\n'));
	}

	await mkdir(path);
	return {
		path,
		remove: async () => {
			await remove(path);
		},
	};
};

interface Options {
	seed: number;
	maximumSteps: number;
	maximumStepsBetweenSyncs: number;
	clientCount: number;

	serverPath: string;
	isJoplinCloud: boolean;
}

const main = async (options: Options) => {
	shimInit();
	Setting.setConstant('env', Env.Dev);

	const cleanupTasks: CleanupTask[] = [];

	const cleanUp = async () => {
		logger.info('Cleaning up....');
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

	let clientPool: ClientPool|null = null;

	try {
		const joplinServerUrl = 'http://localhost:22300/';
		const server = new Server(options.serverPath, joplinServerUrl, {
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

		if (options.isJoplinCloud) {
			logger.info('Sync target: Joplin Cloud');
		}

		const fuzzContext: FuzzContext = {
			serverUrl: joplinServerUrl,
			isJoplinCloud: options.isJoplinCloud,
			baseDir: profilesDirectory.path,
			execApi: server.execApi.bind(server),
			randInt: (a, b) => random.nextInRange(a, b),
		};
		clientPool = await ClientPool.create(
			fuzzContext,
			options.clientCount,
			task => { cleanupTasks.push(task); },
		);
		await clientPool.syncAll();

		const maxSteps = options.maximumSteps;
		for (let stepIndex = 1; maxSteps <= 0 || stepIndex <= maxSteps; stepIndex++) {
			const client = clientPool.randomClient();

			// Ensure that the client starts up-to-date with the other synced clients.
			await client.sync();

			logger.info('Step', stepIndex, '/', maxSteps > 0 ? maxSteps : 'Infinity');
			const actionsBeforeFullSync = fuzzContext.randInt(1, options.maximumStepsBetweenSyncs + 1);
			for (let subStepIndex = 1; subStepIndex <= actionsBeforeFullSync; subStepIndex++) {
				if (actionsBeforeFullSync > 1) {
					logger.info('Sub-step', subStepIndex, '/', actionsBeforeFullSync, '(in step', stepIndex, ')');
				}
				await doRandomAction(fuzzContext, client, clientPool);
			}
			await client.sync();

			// .checkState can fail occasionally due to incomplete
			// syncs (perhaps because the server is still processing
			// share-related changes?). Allow this to be retried:
			await retryWithCount(async () => {
				await clientPool.checkState();
			}, {
				count: 4,
				delayOnFailure: count => count * Second * 2,
				onFail: async () => {
					logger.info('.checkState failed. Syncing all clients...');
					await clientPool.syncAll();
				},
			});
		}
	} catch (error) {
		logger.error('ERROR', error);
		if (clientPool) {
			logger.info('Client information:\n', clientPool.helpText());
			await openDebugSession(clientPool);
		}
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
		[
			'Starts the synchronization fuzzer. The fuzzer starts Joplin Server, creates multiple CLI clients, and attempts to find sync bugs.\n\n',
			'The fuzzer starts Joplin Server in development mode, using the existing development mode database and uses the admin@localhost user to',
			'create and set up user accounts.\n',
			'Use the FUZZER_SERVER_ADMIN_PASSWORD environment variable to specify the admin@localhost password for this dev version of Joplin Server.\n\n',
			'If the fuzzer detects incorrect/unexpected client state, it pauses, allowing the profile directories and databases',
			'of the clients to be inspected.',
		].join(' '),
		(yargs) => {
			return yargs.options({
				'seed': { type: 'number', default: 12345 },
				'steps': {
					type: 'number',
					default: 0,
					defaultDescription: 'The maximum number of steps to take before stopping the fuzzer. Set to zero for an unlimited number of steps.',
				},
				'steps-between-syncs': {
					type: 'number',
					default: 3,
					defaultDescription: 'The maximum number of sub-steps taken before all clients are synchronised.',
				},
				'clients': {
					type: 'number',
					default: 3,
					defaultDescription: 'Number of client apps to create.',
				},
				'joplin-cloud': {
					type: 'string',
					default: '',
					defaultDescription: [
						'A path: If provided, this should be an absolute path to a Joplin Cloud repository. ',
						'This also enables testing for some Joplin Cloud-specific features (e.g. read-only shares).',
					].join(''),
				},
			});
		},
		async (argv) => {
			const serverPath = argv.joplinCloud ? argv.joplinCloud : join(packagesDir, 'server');
			await main({
				seed: argv.seed,
				maximumSteps: argv.steps,
				clientCount: argv.clients,
				serverPath: serverPath,
				isJoplinCloud: !!argv.joplinCloud,
				maximumStepsBetweenSyncs: argv['steps-between-syncs'],
			});
		},
	)
	.help()
	.argv;
