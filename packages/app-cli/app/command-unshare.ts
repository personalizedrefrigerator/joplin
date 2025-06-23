import { _ } from '@joplin/lib/locale';
import BaseCommand from './base-command';
import app from './app';
import { reg } from '@joplin/lib/registry';
import Logger from '@joplin/utils/Logger';
import ShareService from '@joplin/lib/services/share/ShareService';
import { ModelType } from '@joplin/lib/BaseModel';
import { substrWithEllipsis } from '@joplin/lib/string-utils';

const logger = Logger.create('command-unshare');

interface Args {
	options: {
		force: boolean;
	};
	// eslint-disable-next-line id-denylist -- The "notebook" identifier comes from the UI.
	notebook: string;
}

class Command extends BaseCommand {
	public usage() {
		return 'unshare <notebook>';
	}

	public description() {
		return _('Unshares the specified <notebook>, if previously shared.');
	}

	public override options() {
		return [
			['-f, --force', _('Unshares the notebook without asking for confirmation.')],
		];
	}

	public async action(args: Args) {
		const folder = await app().loadItem(ModelType.Folder, args.notebook);

		const ellipsizedFolderTitle = substrWithEllipsis(folder.title, 0, 32);
		if (!folder.is_shared) {
			throw new Error(_('Notebook "%s" is not shared', ellipsizedFolderTitle));
		}

		const force = args.options.force;
		const ok = force ? true : await this.prompt(
			_('Unshare notebook "%s"? This may cause other users to lose access to the notebook.', ellipsizedFolderTitle),
			{ booleanAnswerDefault: 'n' },
		);
		if (!ok) return;

		logger.info('Unsharing folder', folder.id);
		await ShareService.instance().unshareFolder(folder.id);
		await reg.scheduleSync();
	}
}

module.exports = Command;
