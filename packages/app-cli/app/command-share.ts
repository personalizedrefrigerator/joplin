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
import { substrWithEllipsis } from '@joplin/lib/string-utils';

const logger = Logger.create('command-share');

type Args = {
	command: string;
	// eslint-disable-next-line id-denylist -- The "notebook" identifier comes from the UI.
	notebook?: string;
	user?: string;
	options: {
		'read-only'?: boolean;
		json?: boolean;
	};
};

class Command extends BaseCommand {
	public usage() {
		return 'share <command> [notebook] [user]';
	}

	public description() {
		return _('Shares or unshares the specified [notebook] with [user]. Requires Joplin Cloud or Joplin Server.\nCommands: `add`, `remove`, `list`, `accept`, and `reject`.');
	}

	public options() {
		return [
			['--read-only', _('Don\'t allow the share recipient to write to the shared notebook. Valid only for the `add` subcommand.')],
			['--json', _('Prefer JSON output.')],
		];
	}

	public async action(args: Args) {
		const folderTitle = (folder: FolderEntity|null) => {
			return folder ? substrWithEllipsis(folder.title, 0, 32) : _('[None]');
		};

		const commandShareAdd = async (folder: FolderEntity, email: string) => {
			await reg.waitForSyncFinishedThenSync();

			const share = await ShareService.instance().shareFolder(folder.id);

			const permissions = {
				can_read: 1,
				can_write: args.options['read-only'] ? 0 : 1,
			};
			logger.debug('Sharing folder', folder.id, 'with', email, 'permissions=', permissions);

			await ShareService.instance().addShareRecipient(share.id, share.master_key_id, email, permissions);

			await ShareService.instance().refreshShares();
			await ShareService.instance().refreshShareUsers(share.id);

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

			const share = getShareFromFolderId(folder.id);
			if (!share) {
				throw new Error(`No share found for folder ${folder.id}`);
			}

			await ShareService.instance().refreshShareUsers(share.id);

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

			await ShareService.instance().maintenance();

			if (folder) {
				const share = getShareFromFolderId(folder.id);
				await ShareService.instance().refreshShareUsers(share.id);

				const shareUsers = getShareUsers(folder.id);
				const output = {
					folderTitle: folderTitle(folder),
					sharedWith: (shareUsers ?? []).map(user => ({
						email: user.user.email,
						readOnly: user.can_read && !user.can_write,
					})),
				};

				if (args.options.json) {
					this.stdout(JSON.stringify(output));
				} else {
					this.stdout(_('Folder "%s" is shared with:', output.folderTitle));
					for (const user of output.sharedWith) {
						this.stdout(`\t${user.email}\t${user.readOnly ? _('(Read-only)') : ''}`);
					}
				}
			} else {
				const shareState = getShareState();
				const output = {
					invitations: shareState.shareInvitations.map(invitation => ({
						accepted: invitation.status === ShareUserStatus.Accepted,
						waiting: invitation.status === ShareUserStatus.Waiting,
						rejected: invitation.status === ShareUserStatus.Rejected,
						folderId: invitation.share.folder_id,
						fromUser: {
							email: invitation.share.user?.email,
						},
					})),
					shares: shareState.shares.map(share => ({
						isFolder: !!share.folder_id,
						isNote: !!share.note_id,
						itemId: share.folder_id ?? share.note_id,
						fromUser: {
							email: share.user?.email,
						},
					})),
				};

				if (args.options.json) {
					this.stdout(JSON.stringify(output));
				} else {
					this.stdout(_('Incoming shares:'));
					let loggedInvitation = false;
					for (const invitation of output.invitations) {
						let message;
						if (invitation.waiting) {
							message = _('Waiting: Notebook %s from %s', invitation.folderId, invitation.fromUser.email);
						}
						if (invitation.accepted) {
							const folder = await Folder.load(invitation.folderId);
							message = _('Accepted: Notebook %s from %s', folderTitle(folder), invitation.fromUser.email);
						}

						if (message) {
							this.stdout(`\t${message}`);
							loggedInvitation = true;
						}
					}
					if (!loggedInvitation) {
						this.stdout(`\t${_('None')}`);
					}

					this.stdout(_('All shared folders:'));
					if (output.shares.length) {
						for (const share of output.shares) {
							let title;
							if (share.isFolder) {
								title = folderTitle(await Folder.load(share.itemId));
							} else {
								title = share.itemId;
							}

							if (share.fromUser?.email) {
								this.stdout(`\t${_('%s from %s', title, share.fromUser?.email)}`);
							} else {
								this.stdout(`\t${title} - ${share.itemId}`);
							}
						}
					} else {
						this.stdout(`\t${_('None')}`);
					}
				}
			}
		};

		const commandShareAcceptOrReject = async (folderId: string, accept: boolean) => {
			await ShareService.instance().maintenance();

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

			await ShareService.instance().maintenance();

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
}

module.exports = Command;
