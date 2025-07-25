import { CommandRuntime, CommandDeclaration, CommandContext } from '../services/CommandService';
import { _ } from '../locale';
import ShareService from '../services/share/ShareService';
import Logger from '@joplin/utils/Logger';
import shim from '../shim';

const logger = Logger.create('leaveSharedFolder');

export const declaration: CommandDeclaration = {
	name: 'leaveSharedFolder',
	label: () => _('Leave notebook...'),
};

interface Options {
	force?: boolean;
}

export const runtime = (): CommandRuntime => {
	return {
		execute: async (_context: CommandContext, folderId: string = null, { force = false }: Options = {}) => {
			const answer = force ? true : await shim.showConfirmationDialog(
				_('This will remove the notebook from your collection and you will no longer have access to its content. Do you wish to continue?'),
			);
			if (!answer) return;

			try {
				// Since we are going to delete the notebook, do some extra safety checks. In particular:
				// - Check that the notebook is indeed being shared.
				// - Check that it does **not** belong to the current user.

				const shares = await ShareService.instance().refreshShares();
				const share = shares.find(s => s.folder_id === folderId);
				if (!share) throw new Error(_('Could not verify the share status of this notebook - aborting. Please try again when you are connected to the internet.'));

				await ShareService.instance().leaveSharedFolder(folderId, share.user.id);
			} catch (error) {
				logger.error(error);
				await shim.showErrorDialog(_('Error: %s', error.message));
			}
		},
		enabledCondition: 'joplinServerConnected && folderIsShareRootAndNotOwnedByUser',
	};
};
