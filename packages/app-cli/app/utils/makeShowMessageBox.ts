import { ShowMessageBoxOptions } from '@joplin/lib/shim';
import { Gui } from '../types';
import { _ } from '@joplin/lib/locale';

const makeShowMessageBox = (gui: Gui) => async (message: string, options: ShowMessageBoxOptions) => {
	let answers = options.buttons ?? [_('Ok'), _('Cancel')];

	if (options.type === 'error' || options.type === 'info') {
		answers = [];
	}

	message += answers.length ? `(${answers.join(', ')})` : '';

	const answer = await gui.prompt(options.title ?? '', `${message} `, { answers });

	if (answers.includes(answer)) {
		return answers.indexOf(answer);
	} else if (answer) {
		return answers.findIndex(a => a.startsWith(answer));
	}

	return -1;
};

export default makeShowMessageBox;
