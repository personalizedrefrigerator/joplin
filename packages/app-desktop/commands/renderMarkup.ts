import markupLanguageUtils from '@joplin/lib/markupLanguageUtils';
import Setting from '@joplin/lib/models/Setting';
import { CommandRuntime, CommandDeclaration, CommandContext } from '@joplin/lib/services/CommandService';
import { themeStyle } from '@joplin/lib/theme';
import attachedResources from '@joplin/lib/utils/attachedResources';
import { MarkupLanguage } from '@joplin/renderer';

export const declaration: CommandDeclaration = {
	name: 'renderMarkup',
};

const getMarkupToHtml = () => {
	const resourceBaseUrl = `joplin-content://note-viewer/${Setting.value('resourceDir')}/`;

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
