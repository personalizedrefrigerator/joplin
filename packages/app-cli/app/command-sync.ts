import { _ } from '@joplin/lib/locale';
import Setting from '@joplin/lib/models/Setting';
import SyncTargetRegistry from '@joplin/lib/SyncTargetRegistry';
import MigrationHandler from '@joplin/lib/services/synchronizer/MigrationHandler';
import ResourceFetcher from '@joplin/lib/services/ResourceFetcher';
import Synchronizer from '@joplin/lib/Synchronizer';
import { masterKeysWithoutPassword } from '@joplin/lib/services/e2ee/utils';
import { appTypeToLockType } from '@joplin/lib/services/synchronizer/LockHandler';
const BaseCommand = require('./base-command').default;
import app from './app';
const { OneDriveApiNodeUtils } = require('@joplin/lib/onedrive-api-node-utils.js');
import { reg } from '@joplin/lib/registry';
const { cliUtils } = require('./cli-utils.js');
const md5 = require('md5');
import * as locker from 'proper-lockfile';
import { pathExists, writeFile } from 'fs-extra';
import { checkIfLoginWasSuccessful, generateApplicationConfirmUrl } from '@joplin/lib/services/joplinCloudUtils';
import Logger from '@joplin/utils/Logger';
import { uuidgen } from '@joplin/lib/uuid';
import ShareService from '@joplin/lib/services/share/ShareService';

const logger = Logger.create('command-sync');

class Command extends BaseCommand {

	private syncTargetId_: number = null;
	// eslint-disable-next-line @typescript-eslint/ban-types -- Old code before rule was applied
	private releaseLockFn_: Function = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	private oneDriveApiUtils_: any = null;

	public usage() {
		return 'sync';
	}

	public description() {
		return _('Synchronises with remote storage.');
	}

	public options() {
		return [
			['--target <target>', _('Sync to provided target (defaults to sync.target config value)')],
			['--upgrade', _('Upgrade the sync target to the latest version.')],
			['--use-lock <value>', 'Disable local locks that prevent multiple clients from synchronizing at the same time (Default = 1)'],
		];
	}

	private static async lockFile(filePath: string) {
		return locker.lock(filePath, { stale: 1000 * 60 * 5 });
	}

	private static async isLocked(filePath: string) {
		return locker.check(filePath);
	}

	public async doAuth() {
		const syncTarget = reg.syncTarget(this.syncTargetId_);
		const syncTargetMd = SyncTargetRegistry.idToMetadata(this.syncTargetId_);

		if (this.syncTargetId_ === 3 || this.syncTargetId_ === 4) {
			// OneDrive
			this.oneDriveApiUtils_ = new OneDriveApiNodeUtils(syncTarget.api());
			const auth = await this.oneDriveApiUtils_.oauthDance({
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
				log: (...s: any[]) => {
					return this.stdout(...s);
				},
			});
			this.oneDriveApiUtils_ = null;

			Setting.setValue(`sync.${this.syncTargetId_}.auth`, auth ? JSON.stringify(auth) : null);
			if (!auth) {
				this.stdout(_('Authentication was not completed (did not receive an authentication token).'));
				return false;
			}

			return true;
		} else if (syncTargetMd.name === 'dropbox') {
			// Dropbox
			const api = await syncTarget.api();
			const loginUrl = api.loginUrl();
			this.stdout(_('To allow Joplin to synchronise with Dropbox, please follow the steps below:'));
			this.stdout(_('Step 1: Open this URL in your browser to authorise the application:'));
			this.stdout(loginUrl);
			const authCode = await this.prompt(_('Step 2: Enter the code provided by Dropbox:'), { type: 'string' });
			if (!authCode) {
				this.stdout(_('Authentication was not completed (did not receive an authentication token).'));
				return false;
			}

			const response = await api.execAuthToken(authCode);
			Setting.setValue(`sync.${this.syncTargetId_}.auth`, response.access_token);
			api.setAuthToken(response.access_token);
			return true;
		} else if (syncTargetMd.name === 'joplinCloud') {
			const applicationAuthId = uuidgen();
			const checkForCredentials = async () => {
				try {
					const applicationAuthUrl = `${Setting.value('sync.10.path')}/api/application_auth/${applicationAuthId}`;
					const response = await checkIfLoginWasSuccessful(applicationAuthUrl);
					if (response && response.success) {
						return response;
					}
					return null;
				} catch (error) {
					logger.error(error);
					throw error;
				}
			};

			this.stdout(_('To allow Joplin to synchronise with Joplin Cloud, please login using this URL:'));

			const confirmUrl = `${Setting.value('sync.10.website')}/applications/${applicationAuthId}/confirm`;
			const urlWithClient = await generateApplicationConfirmUrl(confirmUrl);
			this.stdout(urlWithClient);

			const authorized = await this.prompt(_('Have you authorised the application login in the above URL?'), { booleanAnswerDefault: 'y' });
			if (!authorized) return false;
			const result = await checkForCredentials();
			if (!result) return false;
			return true;
		}

		this.stdout(_('Not authenticated with %s. Please provide any missing credentials.', syncTargetMd.label));
		return false;
	}

	public cancelAuth() {
		if (this.oneDriveApiUtils_) {
			this.oneDriveApiUtils_.cancelOAuthDance();
			return;
		}
	}

	public doingAuth() {
		return !!this.oneDriveApiUtils_;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	public async action(args: any) {
		this.releaseLockFn_ = null;

		// Lock is unique per profile/database
		const lockFilePath = `${require('os').tmpdir()}/synclock_${md5(escape(Setting.value('profileDir')))}`; // https://github.com/pvorb/node-md5/issues/41
		if (!(await pathExists(lockFilePath))) await writeFile(lockFilePath, 'synclock');

		const useLock = args.options.useLock !== 0;

		if (useLock) {
			try {
				if (await Command.isLocked(lockFilePath)) throw new Error(_('Synchronisation is already in progress.'));

				this.releaseLockFn_ = await Command.lockFile(lockFilePath);
			} catch (error) {
				if (error.code === 'ELOCKED') {
					const msg = _('Lock file is already being hold. If you know that no synchronisation is taking place, you may delete the lock file at "%s" and resume the operation.', error.file);
					this.stdout(msg);
					return;
				}
				throw error;
			}
		}

		const cleanUp = () => {
			cliUtils.redrawDone();
			if (this.releaseLockFn_) {
				this.releaseLockFn_();
				this.releaseLockFn_ = null;
			}
		};

		try {
			this.syncTargetId_ = Setting.value('sync.target');
			if (args.options.target) this.syncTargetId_ = args.options.target;

			const syncTarget = reg.syncTarget(this.syncTargetId_);

			if (!(await syncTarget.isAuthenticated())) {
				app().gui().showConsole();
				app().gui().maximizeConsole();

				const authDone = await this.doAuth();
				if (!authDone) return cleanUp();
			}

			const sync = await syncTarget.synchronizer();

			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
			const options: any = {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
				onProgress: (report: any) => {
					const lines = Synchronizer.reportToLines(report);
					if (lines.length) cliUtils.redraw(lines.join(' '));
				},
				onMessage: (msg: string) => {
					cliUtils.redrawDone();
					this.stdout(msg);
				},
			};

			this.stdout(_('Synchronisation target: %s (%s)', Setting.enumOptionLabel('sync.target', this.syncTargetId_), this.syncTargetId_));

			if (!sync) throw new Error(_('Cannot initialise synchroniser.'));

			if (args.options.upgrade) {
				let migrationError = null;

				try {
					const migrationHandler = new MigrationHandler(
						sync.api(),
						reg.db(),
						sync.lockHandler(),
						appTypeToLockType(Setting.value('appType')),
						Setting.value('clientId'),
					);

					migrationHandler.setLogger(cliUtils.stdoutLogger(this.stdout.bind(this)));

					await migrationHandler.upgrade();
				} catch (error) {
					migrationError = error;
				}

				if (!migrationError) {
					Setting.setValue('sync.upgradeState', Setting.SYNC_UPGRADE_STATE_IDLE);
					await Setting.saveAll();
				}

				if (migrationError) throw migrationError;

				return cleanUp();
			}

			// Refresh share invitations -- if running without a GUI, some of the
			// maintenance tasks may otherwise be skipped.
			await ShareService.instance().maintenance();

			this.stdout(_('Starting synchronisation...'));

			const contextKey = `sync.${this.syncTargetId_}.context`;
			let context = Setting.value(contextKey);

			context = context ? JSON.parse(context) : {};
			options.context = context;

			try {
				const newContext = await sync.start(options);
				Setting.setValue(contextKey, JSON.stringify(newContext));
			} catch (error) {
				if (error.code === 'alreadyStarted') {
					this.stdout(error.message);
				} else {
					throw error;
				}
			}

			// When using the tool in command line mode, the ResourceFetcher service is
			// not going to be running in the background, so the resources need to be
			// explicitly downloaded below.
			if (!app().hasGui()) {
				this.stdout(_('Downloading resources...'));
				await ResourceFetcher.instance().fetchAll();
				await ResourceFetcher.instance().waitForAllFinished();
			}

			const noPasswordMkIds = await masterKeysWithoutPassword();
			if (noPasswordMkIds.length) this.stdout(`/!\\ ${_('Your password is needed to decrypt some of your data. Type `:e2ee decrypt` to set it.')}`);

			await app().refreshCurrentFolder();
		} catch (error) {
			cleanUp();
			throw error;
		}

		if (Setting.value('sync.upgradeState') > Setting.SYNC_UPGRADE_STATE_IDLE) {
			this.stdout(`/!\\ ${_('Sync target must be upgraded! Run `%s` to proceed.', 'sync --upgrade')}`);
			app().gui().showConsole();
			app().gui().maximizeConsole();
		}

		cleanUp();
	}

	public async cancel() {
		if (this.doingAuth()) {
			this.cancelAuth();
			return;
		}

		const syncTargetId = this.syncTargetId_ ? this.syncTargetId_ : Setting.value('sync.target');

		cliUtils.redrawDone();

		this.stdout(_('Cancelling... Please wait.'));

		const syncTarget = reg.syncTarget(syncTargetId);

		if (await syncTarget.isAuthenticated()) {
			const sync = await syncTarget.synchronizer();
			if (sync) await sync.cancel();
		} else {
			if (this.releaseLockFn_) this.releaseLockFn_();
			this.releaseLockFn_ = null;
		}

		this.syncTargetId_ = null;
	}

	public cancellable() {
		return true;
	}
}

module.exports = Command;
