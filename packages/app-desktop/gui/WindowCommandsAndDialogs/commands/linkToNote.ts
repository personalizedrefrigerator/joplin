import CommandService, { CommandRuntime, CommandDeclaration, CommandContext } from '@joplin/lib/services/CommandService';
import { _ } from '@joplin/lib/locale';
import { Mode } from '../../../plugins/GotoAnything';
import { GotoAnythingOptions, UiType } from './gotoAnything';
import { ModelType } from '@joplin/lib/BaseModel';
import Logger from '@joplin/utils/Logger';
import markdownUtils from '@joplin/lib/markdownUtils';
import { MarkupLanguage } from '@joplin/renderer';
import { htmlentities } from '@joplin/utils/html';
import Note from '@joplin/lib/models/Note';

const logger = Logger.create('linkToNote');

export const declaration: CommandDeclaration = {
	name: 'linkToNote',
	label: () => _('Link to note...'),
	iconName: 'fas fa-file-export',
};

export const runtime = (): CommandRuntime => {
	return {
		execute: async (_context: CommandContext) => {
			const options: GotoAnythingOptions = {
				mode: Mode.TitleOnly,
				alwaysShowHelp: true,
			};
			const result = await CommandService.instance().execute('gotoAnything', UiType.ControlledApi, options);
			if (!result) return result;

			if (result.type !== ModelType.Note) {
				logger.warn('Retrieved item is not a note:', result);
				return null;
			}

			const note = await Note.load(result.item.id, { fields: ['title', 'id', 'markup_language'] });
			if (!note) return null;

			let link;
			if (note.markup_language === MarkupLanguage.Html) {
				link = `<a href=":/${htmlentities(note.id)}">${htmlentities(note.title)}</a>`;
			} else {
				link = `[${markdownUtils.escapeTitleText(note.title)}](:/${markdownUtils.escapeLinkUrl(note.id)})`;
			}
			await CommandService.instance().execute('insertText', link);
			return result;
		},

		enabledCondition: '(markdownEditorPaneVisible || richTextEditorVisible) && !noteIsReadOnly && !noteIsDeleted',
	};
};
