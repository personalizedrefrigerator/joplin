
import BaseApplication, { StartOptions } from '@joplin/lib/BaseApplication';
import Database from '@joplin/lib/database';
import JoplinDatabase from '@joplin/lib/JoplinDatabase';
import { ProfilesInfo } from '@joplin/lib/services/profileConfig/types';
import { MatchedStartFlags } from '@joplin/lib/utils/processStartFlags';
import Logger, { LogLevel, TargetType } from '@joplin/utils/Logger';
import DatabaseDriverReactNative from './utils/database-driver-react-native';
import Setting, { AppType } from '@joplin/lib/models/Setting';
import { getDatabaseName, getPluginDataDir, getProfilesRootDir, getResourceDir } from './services/profiles';
import { getCurrentProfile } from '@joplin/lib/services/profileConfig';
import rsa from './services/e2ee/RSA.react-native';
import shim from '@joplin/lib/shim';
import initProfile from '@joplin/lib/services/profileConfig/initProfile';
import { Platform } from 'react-native';
import setIgnoreTlsErrors from './utils/TlsUtils';
import { refreshFolders } from '@joplin/lib/folders-screen-utils';
import Tag from '@joplin/lib/models/Tag';
import { parseNotesParent } from '@joplin/lib/reducer';
import Folder from '@joplin/lib/models/Folder';
import { DEFAULT_ROUTE } from './utils/appDefaultState';
import { clearSharedFilesCache } from './utils/ShareUtils';

const logger = Logger.create('App');

const initializeTempDir = async () => {
	const tempDir = `${getProfilesRootDir()}/tmp`;

	// Re-create the temporary directory.
	try {
		await shim.fsDriver().remove(tempDir);
	} catch (_error) {
		// The logger may not exist yet. Do nothing.
	}

	await shim.fsDriver().mkdir(tempDir);
	return tempDir;
};


const getInitialActiveFolder = async () => {
	let folderId = Setting.value('activeFolderId');

	// In some cases (e.g. new profile/install), activeFolderId hasn't been set yet.
	// Because activeFolderId is used to determine the parent for new notes, initialize
	// it here:
	if (!folderId) {
		folderId = (await Folder.defaultFolder())?.id;
		if (folderId) {
			Setting.setValue('activeFolderId', folderId);
		}
	}
	return await Folder.load(folderId);
};

class Application extends BaseApplication {
	private logDatabase_: Database;
	public override hasGui() {
		return true;
	}

	protected override async initLogger(_setupGlobalLogger: boolean, logLevel: LogLevel | null): Promise<Logger> {
		const logDatabase = new Database(new DatabaseDriverReactNative());
		await logDatabase.open({ name: 'log.sqlite' });
		await logDatabase.exec(Logger.databaseCreateTableSql());

		this.logDatabase_ = logDatabase;

		const mainLogger = new Logger();
		mainLogger.addTarget(TargetType.Database, { database: logDatabase, source: 'm' });
		mainLogger.setLevel(logLevel ?? Logger.LEVEL_INFO);

		if (Setting.value('env') === 'dev') {
			mainLogger.addTarget(TargetType.Console);
			mainLogger.setLevel(Logger.LEVEL_DEBUG);
		}
		Logger.initializeGlobalLogger(mainLogger);

		return mainLogger;
	}

	protected async openDatabase(profilesInfo: ProfilesInfo, _globalLogger: Logger) {
		const dbLogger = new Logger();
		dbLogger.addTarget(TargetType.Database, { database: this.logDatabase_, source: 'm' });
		if (Setting.value('env') === 'dev') {
			dbLogger.addTarget(TargetType.Console);
			dbLogger.setLevel(Logger.LEVEL_INFO); // Set to LEVEL_DEBUG for full SQL queries
		} else {
			dbLogger.setLevel(Logger.LEVEL_INFO);
		}

		const db = new JoplinDatabase(new DatabaseDriverReactNative());
		db.setLogger(dbLogger);
		const currentProfile = getCurrentProfile(profilesInfo.profileConfig);
		const isSubProfile = profilesInfo.isSubProfile;
		if (Setting.value('env') === 'prod') {
			await db.open({ name: getDatabaseName(currentProfile, isSubProfile) });
		} else {
			await db.open({ name: getDatabaseName(currentProfile, isSubProfile, '-20240127-1') });
		}
		return db;
	}

	protected override async getRSA() {
		return rsa;
	}

	protected override async getExtraInitArgs(_profile: ProfilesInfo): Promise<MatchedStartFlags> {
		return { };
	}

	protected async initProfileAndDirs(_initArgs: MatchedStartFlags, _startupOptions: StartOptions): Promise<ProfilesInfo> {
		const profileInfo = await initProfile(getProfilesRootDir());
		const { profileConfig, isSubProfile } = profileInfo;
		const currentProfile = getCurrentProfile(profileConfig);

		Setting.setConstant('appType', AppType.Mobile);
		Setting.setConstant('tempDir', await initializeTempDir());
		Setting.setConstant('cacheDir', `${getProfilesRootDir()}/cache`);
		const resourceDir = getResourceDir(currentProfile, isSubProfile);
		Setting.setConstant('resourceDir', resourceDir);
		Setting.setConstant('pluginDir', `${getProfilesRootDir()}/plugins`);
		Setting.setConstant('pluginDataDir', getPluginDataDir(currentProfile, isSubProfile));

		await shim.fsDriver().mkdir(resourceDir);

		return profileInfo;
	}

	protected override async handleFirstStart() {
		const detectedLocale = shim.detectAndSetLocale(Setting);
		logger.info(`First start: detected locale as ${detectedLocale}`);

		if (shim.mobilePlatform() === 'web') {
			// Web browsers generally have more limited storage than desktop and mobile apps:
			Setting.setValue('sync.resourceDownloadMode', 'auto');
			// For now, geolocation is disabled by default on web until the web permissions workflow
			// is improved. At present, trackLocation=true causes the "allow location access" prompt
			// to appear without a clear indicator for why Joplin wants this information.
			Setting.setValue('trackLocation', false);
			logger.info('First start on web: Set resource download mode to auto and disabled location tracking.');
		}

		Setting.skipDefaultMigrations();
		Setting.setValue('firstStart', false);
	}

	protected override async setDefaultSettings(): Promise<void> {
		// TODO: Why is this only present on mobile?
		if (Setting.value('db.ftsEnabled') === -1) {
			const ftsEnabled = await this.database_.ftsEnabled();
			Setting.setValue('db.ftsEnabled', ftsEnabled ? 1 : 0);
			logger.info('db.ftsEnabled = ', Setting.value('db.ftsEnabled'));
		}

		// Note: for now we hard-code the folder sort order as we need to
		// create a UI to allow customisation (started in branch mobile_add_sidebar_buttons)
		Setting.setValue('folders.sortOrder.field', 'title');
		Setting.setValue('folders.sortOrder.reverse', false);

		if (Platform.OS === 'android') {
			const ignoreTlsErrors = Setting.value('net.ignoreTlsErrors');
			if (ignoreTlsErrors) {
				await setIgnoreTlsErrors(ignoreTlsErrors);
			}
		}
	}

	public override async start(): Promise<string[]> {
		Setting.setConstant('appId', 'net.cozic.joplin-mobile');
		Setting.setConstant('appType', AppType.Mobile);

		let argv: string[] = [];
		if (__DEV__) {
			argv.push('--env', 'dev');
		}
		argv = await super.start(argv, {
			appId: 'net.cozic.joplin-mobile',
		});
		this.initRedux();


		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		await refreshFolders((action: any) => this.dispatch(action), '');

		const tags = await Tag.allWithNotes();
		this.dispatch({
			type: 'TAG_UPDATE_ALL',
			items: tags,
		});

		this.dispatch({
			type: 'FOLDER_SET_COLLAPSED_ALL',
			ids: Setting.value('collapsedFolderIds'),
		});

		const notesParent = parseNotesParent(Setting.value('notesParent'), Setting.value('activeFolderId'));

		const folder = await getInitialActiveFolder();
		if (notesParent && notesParent.type === 'SmartFilter') {
			this.dispatch(DEFAULT_ROUTE);
		} else if (!folder) {
			this.dispatch(DEFAULT_ROUTE);
		} else {
			this.dispatch({
				type: 'NAV_GO',
				routeName: 'Notes',
				folderId: folder.id,
			});
		}

		await clearSharedFilesCache();

		return argv;
	}
}

let application_: Application = null;

function app() {
	if (application_) return application_;
	application_ = new Application();
	return application_;
}

export default app;
