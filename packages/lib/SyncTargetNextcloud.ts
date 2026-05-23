// The Nextcloud sync target is essentially a wrapper over the WebDAV sync target,
// thus all the calls to SyncTargetWebDAV to avoid duplicate code.

import BaseSyncTarget from './BaseSyncTarget';
import { _ } from './locale';
import Setting from './models/Setting';
import Synchronizer from './Synchronizer';
const SyncTargetWebDAV = require('./SyncTargetWebDAV');

export default class SyncTargetNextcloud extends BaseSyncTarget {

	public static id() {
		return 5;
	}

	public static supportsConfigCheck() {
		return true;
	}

	public static targetName() {
		return 'nextcloud';
	}

	public static label() {
		return _('Nextcloud');
	}

	public static description() {
		return 'A suite of client-server software for creating and using file hosting services.';
	}

	public async isAuthenticated() {
		return true;
	}

	public static requiresPassword() {
		return true;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	public static async checkConfig(options: any) {
		return SyncTargetWebDAV.checkConfig(options);
	}

	public async initFileApi() {
		const fileApi = await SyncTargetWebDAV.newFileApi_(SyncTargetNextcloud.id(), {
			path: () => Setting.value('sync.5.path'),
			username: () => Setting.value('sync.5.username'),
			password: () => Setting.value('sync.5.password'),
			ignoreTlsErrors: () => Setting.value('net.ignoreTlsErrors'),
		});

		fileApi.setLogger(this.logger());

		return fileApi;
	}

	public async initSynchronizer() {
		return new Synchronizer(this.db(), await this.fileApi(), Setting.value('appType'));
	}

}
