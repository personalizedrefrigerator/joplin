import { _ } from '@joplin/lib/locale';
import BaseCommand from './base-command';
import app from './app';
import { reg } from '@joplin/lib/registry';
import Logger from '@joplin/utils/Logger';
import ShareService from '@joplin/lib/services/share/ShareService';
import { ModelType } from '@joplin/lib/BaseModel';

const logger = Logger.create('command-share');

type Args = {
	// eslint-disable-next-line id-denylist -- The "notebook" identifier comes from the UI.
	notebook: string;
	user: string;
	options: {
		'read-only'?: boolean;
	};
};

class Command extends BaseCommand {
	private cancelCounter_ = 0;

	public usage() {
		return 'share <notebook> <user>';
	}

	public description() {
		return _('Shares the specified <notebook> with <user>. Requires Joplin Cloud or Joplin Server.');
	}

	public options() {
		return [
			['--read-only', _('Don\'t allow the share recipient to write to the shared notebook')],
		];
	}

	public async action(args: Args) {
		const cancelCounter = this.cancelCounter_;
		const cancelled = () => cancelCounter !== this.cancelCounter_;

		await reg.waitForSyncFinishedThenSync();
		if (cancelled()) return;

		const folder = await app().loadItem(ModelType.Folder, args.notebook);
		if (!folder) {
			throw new Error(`Folder not found: ${folder.id}`);
		}
		const share = await ShareService.instance().shareFolder(folder.id);
		if (cancelled()) return;

		const recipientEmail = args.user;

		const permissions = {
			can_read: 1,
			can_write: args.options['read-only'] ? 0 : 1,
		};
		logger.debug('Sharing folder', folder.id, 'with', recipientEmail, 'permissions=', permissions);

		await ShareService.instance().addShareRecipient(share.id, share.master_key_id, recipientEmail, permissions);

		await ShareService.instance().refreshShares();
		await ShareService.instance().refreshShareUsers(share.id);
		if (cancelled()) return;

		await reg.waitForSyncFinishedThenSync();
	}

	public async cancel() {
		logger.info('Cancelling share...');
		this.stdout(_('Cancelling... Please wait.'));
		this.cancelCounter_ ++;

		const synchronizer = await reg.syncTarget()?.synchronizer();
		synchronizer?.cancel();
	}

	public cancellable() {
		return true;
	}
}

module.exports = Command;
