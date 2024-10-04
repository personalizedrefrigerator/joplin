import Setting from './models/Setting';
import Logger, { TargetType, LoggerWrapper, LogLevel } from '@joplin/utils/Logger';
import shim from './shim';
const { setupProxySettings } = require('./shim-init-node');
import JoplinDatabase from './JoplinDatabase';
const { DatabaseDriverNode } = require('./database-driver-node.js');
import { splitCommandString } from '@joplin/utils';
import dns = require('dns');
import fs = require('fs-extra');
const syswidecas = require('./vendor/syswide-cas');
import initProfile from './services/profileConfig/initProfile';
import RotatingLogs from './RotatingLogs';
import { join } from 'path';
import { MatchedStartFlags } from './utils/processStartFlags';
import determineProfileAndBaseDir from './determineBaseAppDirs';
import BaseApplication from './BaseApplication';
import rsa from './services/e2ee/RSA.node';
import { ProfilesInfo } from './services/profileConfig/types';

const appLogger: LoggerWrapper = Logger.create('App');

// const ntpClient = require('./vendor/ntp-client');
// ntpClient.dgram = require('dgram');

export interface StartOptions {
	keychainEnabled?: boolean;
	setupGlobalLogger?: boolean;
	rootProfileDir?: string;
	appName?: string;
	appId?: string;
}
export const safeModeFlagFilename = 'force-safe-mode-on-next-start';

export default class BaseNodeApplication extends BaseApplication {
	private rotatingLogs: RotatingLogs;

	public constructor() {
		super();
	}

	public async destroy() {
		await super.destroy();

		appLogger.info('Base node application terminated...');
	}

	public override async handleStartFlags(argv: string[], setDefaults = true) {
		const startFlags = await super.handleStartFlags(argv, setDefaults);

		// Work around issues with ipv6 resolution -- default to ipv4first.
		// (possibly incorrect URL serialization see https://github.com/mswjs/msw/issues/1388#issuecomment-1241180921).
		// See also https://github.com/node-fetch/node-fetch/issues/1624#issuecomment-1407717012
		if (startFlags.matched.allowOverridingDnsResultOrder) {
			dns.setDefaultResultOrder('ipv4first');
		}

		return startFlags;
	}

	public async exit(code = 0) {
		await Setting.saveAll();
		process.exit(code);
	}

	public override hasGui() {
		return false;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	protected override async applySettingsSideEffects(action: any = null) {
		await super.applySettingsSideEffects(action);

		const sideEffects: Record<string, ()=> Promise<void>> = {
			'net.ignoreTlsErrors': async () => {
				process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = Setting.value('net.ignoreTlsErrors') ? '0' : '1';
			},
			'net.customCertificates': async () => {
				const caPaths = Setting.value('net.customCertificates').split(',');
				for (let i = 0; i < caPaths.length; i++) {
					const f = caPaths[i].trim();
					if (!f) continue;
					syswidecas.addCAs(f);
				}
			},
			'net.proxyEnabled': async () => {
				setupProxySettings({
					maxConcurrentConnections: Setting.value('sync.maxConcurrentConnections'),
					proxyTimeout: Setting.value('net.proxyTimeout'),
					proxyEnabled: Setting.value('net.proxyEnabled'),
					proxyUrl: Setting.value('net.proxyUrl'),
				});
			},
		};

		sideEffects['sync.maxConcurrentConnections'] = sideEffects['net.proxyEnabled'];
		sideEffects['sync.proxyTimeout'] = sideEffects['net.proxyEnabled'];
		sideEffects['sync.proxyUrl'] = sideEffects['net.proxyEnabled'];

		if (action) {
			const effect = sideEffects[action.key];
			if (effect) await effect();
		} else {
			for (const key in sideEffects) {
				await sideEffects[key]();
			}
		}
	}

	private async readFlagsFromFile(flagPath: string) {
		if (!fs.existsSync(flagPath)) return {};
		let flagContent = fs.readFileSync(flagPath, 'utf8');
		if (!flagContent) return {};

		flagContent = flagContent.trim();

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		let flags: any = splitCommandString(flagContent);
		flags.splice(0, 0, 'cmd');
		flags.splice(0, 0, 'node');

		flags = await this.handleStartFlags(flags, false);

		return flags.matched;
	}

	protected startRotatingLogMaintenance(profileDir: string) {
		this.rotatingLogs = new RotatingLogs(profileDir);
		const processLogs = async () => {
			try {
				await this.rotatingLogs.cleanActiveLogFile();
				await this.rotatingLogs.deleteNonActiveLogFiles();
			} catch (error) {
				appLogger.error(error);
			}
		};
		shim.setTimeout(() => { void processLogs(); }, 60000);
		shim.setInterval(() => { void processLogs(); }, 24 * 60 * 60 * 1000);
	}

	protected override async initProfileAndDirs(initArgs: MatchedStartFlags, startupOptions: StartOptions) {
		const appName = Setting.value('appName');
		const { rootProfileDir, homeDir } = determineProfileAndBaseDir(startupOptions.rootProfileDir ?? initArgs.profileDir, appName);
		const profileInfo = await initProfile(rootProfileDir);
		const { profileDir } = profileInfo;

		const resourceDirName = 'resources';
		const resourceDir = `${profileDir}/${resourceDirName}`;
		const tempDir = `${profileDir}/tmp`;
		const cacheDir = `${profileDir}/cache`;

		Setting.setConstant('resourceDirName', resourceDirName);
		Setting.setConstant('resourceDir', resourceDir);
		Setting.setConstant('tempDir', tempDir);
		Setting.setConstant('pluginDataDir', `${profileDir}/plugin-data`);
		Setting.setConstant('cacheDir', cacheDir);
		Setting.setConstant('pluginDir', `${rootProfileDir}/plugins`);
		Setting.setConstant('homeDir', homeDir);


		try {
			await shim.fsDriver().remove(tempDir);
		} catch (error) {
			// Can't do anything in this case, not even log, since the logger
			// is not yet ready. But normally it's not an issue if the temp
			// dir cannot be deleted.
		}

		await fs.mkdirp(profileDir, 0o755);
		await fs.mkdirp(resourceDir, 0o755);
		await fs.mkdirp(tempDir, 0o755);
		await fs.mkdirp(cacheDir, 0o755);

		// Clean up any remaining watched files (they start with "edit-")
		await shim.fsDriver().removeAllThatStartWith(profileDir, 'edit-');

		const safeModeFlagFile = join(profileDir, safeModeFlagFilename);
		if (await fs.pathExists(safeModeFlagFile) && fs.readFileSync(safeModeFlagFile, 'utf8') === 'true') {
			appLogger.info(`Safe mode enabled because of file: ${safeModeFlagFile}`);
			Setting.setValue('isSafeMode', true);
			fs.removeSync(safeModeFlagFile);
		}

		return profileInfo;
	}

	protected async initLogger(setupGlobalLogger: boolean, logLevel: LogLevel|null): Promise<Logger> {
		const globalLogger = Logger.globalLogger;

		if (setupGlobalLogger) {
			globalLogger.addTarget(TargetType.File, { path: `${Setting.value('profileDir')}/log.txt` });
			if (Setting.value('appType') === 'desktop') {
				globalLogger.addTarget(TargetType.Console);
			}
			globalLogger.setLevel(logLevel);
		}

		return globalLogger;
	}

	protected override async openDatabase(profiles: ProfilesInfo, databaseLogger: Logger) {
		const database = new JoplinDatabase(new DatabaseDriverNode());
		database.setLogExcludedQueryTypes(['SELECT']);
		database.setLogger(databaseLogger);

		const profileDir = profiles.profileDir;
		await database.open({ name: `${profileDir}/database.sqlite` });
		return database;
	}

	protected override async getRSA() {
		return rsa;
	}

	protected async getExtraInitArgs({ profileDir }: ProfilesInfo): Promise<MatchedStartFlags> {
		return await this.readFlagsFromFile(`${profileDir}/flags.txt`);
	}
}
