import markupLanguageUtils from '../markupLanguageUtils';
import Setting from '../models/Setting';
import { CommandRuntime, CommandDeclaration, CommandContext } from '../services/CommandService';
import { themeStyle } from '../theme';
import attachedResources from '../utils/attachedResources';
import { MarkupLanguage } from '@joplin/renderer';

export const declaration: CommandDeclaration = {
	name: 'renderMarkup',
};

const getMarkupToHtml = () => {
	const resourceBaseUrl = 'joplin-resource://';

	return markupLanguageUtils.newMarkupToHtml({}, {
		resourceBaseUrl,
		customCss: '',
	});
};

export const runtime = (): CommandRuntime => {
	return {
		execute: async (_context: CommandContext, markupLanguage: MarkupLanguage, markup: string) => {
			const markupToHtml = getMarkupToHtml();
			const html = await markupToHtml.render(markupLanguage, markup, themeStyle(Setting.value('theme')), {
				resources: await attachedResources(markup),
				splitted: true,
			});
			return html;
		},
	};
};
