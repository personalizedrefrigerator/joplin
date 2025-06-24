import { _ } from '@joplin/lib/locale';
import BaseCommand from './base-command';
import app from './app';
import { reg } from '@joplin/lib/registry';
import Logger from '@joplin/utils/Logger';
import ShareService from '@joplin/lib/services/share/ShareService';
import { ModelType } from '@joplin/lib/BaseModel';
import { FolderEntity } from '@joplin/lib/services/database/types';
import { ShareUserStatus } from '@joplin/lib/services/share/reducer';
import Folder from '@joplin/lib/models/Folder';
import invitationRespond from '@joplin/lib/services/share/invitationRespond';
import CommandService from '@joplin/lib/services/CommandService';

const logger = Logger.create('command-share');

type Args = {
	command: string;
	// eslint-disable-next-line id-denylist -- The "notebook" identifier comes from the UI.
	notebook?: string;
	user?: string;
	options: {
		'read-only'?: boolean;
	};
};

class Command extends BaseCommand {
	private cancelCounter_ = 0;

	public usage() {
		return 'share <command> [notebook] [user]';
	}

	public description() {
		return _('Shares or unshares the specified [notebook] with [user]. Requires Joplin Cloud or Joplin Server.\nCommands: `add`, `remove`, `list`, `accept`, and `reject`.');
	}

	public options() {
		return [
			['--read-only', _('Don\'t allow the share recipient to write to the shared notebook. Valid only for the `add` subcommand.')],
		];
	}

	public async action(args: Args) {
		const cancelCounter = this.cancelCounter_;
		const cancelled = () => cancelCounter !== this.cancelCounter_;

		const commandShareAdd = async (folder: FolderEntity, email: string) => {
			await reg.waitForSyncFinishedThenSync();
			if (cancelled()) return;

			const share = await ShareService.instance().shareFolder(folder.id);
			if (cancelled()) return;

			const permissions = {
				can_read: 1,
				can_write: args.options['read-only'] ? 0 : 1,
			};
			logger.debug('Sharing folder', folder.id, 'with', email, 'permissions=', permissions);

			await ShareService.instance().addShareRecipient(share.id, share.master_key_id, email, permissions);

			await ShareService.instance().refreshShares();
			await ShareService.instance().refreshShareUsers(share.id);
			if (cancelled()) return;

			await reg.waitForSyncFinishedThenSync();
		};

		const getShareState = () => app().store().getState().shareService;
		const getShareFromFolderId = (folderId: string) => {
			const shareState = getShareState();
			const allShares = shareState.shares;
			const share = allShares.find(share => share.folder_id === folderId);
			return share;
		};

		const getShareUsers = (folderId: string) => {
			const share = getShareFromFolderId(folderId);
			if (!share) {
				throw new Error(`No share found for folder ${folderId}`);
			}
			return getShareState().shareUsers[share.id];
		};

		const commandShareRemove = async (folder: FolderEntity, email: string) => {
			await ShareService.instance().refreshShares();
			if (cancelled()) return;

			const share = getShareFromFolderId(folder.id);
			if (!share) {
				throw new Error(`No share found for folder ${folder.id}`);
			}

			await ShareService.instance().refreshShareUsers(share.id);
			if (cancelled()) return;

			const shareUsers = getShareUsers(folder.id);
			if (!shareUsers) {
				throw new Error(`No share found for folder ${folder.id}`);
			}

			const targetUser = shareUsers.find(user => user.user?.email === email);

			await ShareService.instance().deleteShareRecipient(targetUser.id);
			this.stdout(_('Removed %s from share.', targetUser.user.email));
		};

		const commandShareList = async () => {
			let folder = null;
			if (args.notebook) {
				folder = await app().loadItemOrFail(ModelType.Folder, args.notebook);
			}

			await ShareService.instance().refreshShares();
			if (cancelled()) return;

			if (folder) {
				this.stdout(_('Folder "%s" is shared with:', folder.title));
				const shareUsers = getShareUsers(folder.id);
				for (const user of shareUsers) {
					this.stdout(`${user.user.email}\t(${user.can_write ? _('Can write') : _('Read-only')})`);
				}
			} else {
				this.stdout(_('Incoming shares:'));

				const shareState = getShareState();
				let loggedShare = false;
				for (const invitation of shareState.shareInvitations) {
					let status = '';
					if (invitation.status === ShareUserStatus.Waiting) {
						status = _('Waiting');
					} else if (invitation.status === ShareUserStatus.Accepted) {
						status = _('Accepted');
					}

					if (status) {
						this.stdout(`\t${_('%s: Folder %s from %s', status, invitation.share.folder_id, invitation.share.user?.email)}`);
						loggedShare = true;
					}
				}

				if (!loggedShare) {
					this.stdout(`\t${_('No incoming shares')}`);
				}

				this.stdout(_('All shared folders:'));
				let loggedSharedFolder = false;
				for (const share of shareState.shares) {
					if (!share.folder_id) continue;

					const folder = await Folder.load(share.folder_id);
					this.stdout(`\t${_('%s from %s', folder?.title ?? 'Unknown', share.user?.email)}`);
					loggedSharedFolder = true;
				}

				if (!loggedSharedFolder) {
					this.stdout(`\t${_('No shared folders')}`);
				}
			}
		};

		const commandShareAcceptOrReject = async (folderId: string, accept: boolean) => {
			const shareState = getShareState();
			const invitation = shareState.shareInvitations.find(invitation => {
				return invitation.share.folder_id === folderId;
			});
			if (!invitation) throw new Error('No such invitation found');

			this.stdout(accept ? _('Accepting share...') : _('Rejecting share...'));
			await invitationRespond(invitation.id, invitation.share.folder_id, invitation.master_key, accept);
		};

		if (args.command === 'add' || args.command === 'remove') {
			if (!args.notebook) throw new Error('[notebook] is required');
			if (!args.user) throw new Error('[user] is required');

			const email = args.user;
			const folder = await app().loadItemOrFail(ModelType.Folder, args.notebook);
			if (args.command === 'add') {
				return commandShareAdd(folder, email);
			} else if (args.command === 'remove') {
				return commandShareRemove(folder, email);
			}
		}

		if (args.command === 'leave') {
			const folder = args.notebook ? await app().loadItemOrFail(ModelType.Folder, args.notebook) : null;
			return CommandService.instance().execute('leaveSharedFolder', folder.id);
		}

		if (args.command === 'list') {
			return commandShareList();
		}

		if (args.command === 'accept') {
			return commandShareAcceptOrReject(args.notebook, true);
		}

		if (args.command === 'reject') {
			return commandShareAcceptOrReject(args.notebook, false);
		}

		throw new Error(`Unknown subcommand: ${args.command}`);
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
