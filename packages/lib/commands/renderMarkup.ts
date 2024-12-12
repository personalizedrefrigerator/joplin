import markupLanguageUtils from '../markupLanguageUtils';
import Setting from '../models/Setting';
import { CommandRuntime, CommandDeclaration, CommandContext } from '../services/CommandService';
import { themeStyle } from '../theme';
import attachedResources from '../utils/attachedResources';
import { MarkupLanguage } from '@joplin/renderer';
import { Options } from '@joplin/renderer/MdToHtml';
import { RenderOptions } from '@joplin/renderer/types';

export const declaration: CommandDeclaration = {
	name: 'renderMarkup',
};

const getMarkupToHtml = () => {
	return markupLanguageUtils.newMarkupToHtml({}, {
		resourceBaseUrl: `file://${Setting.value('resourceDir')}/`,
		customCss: '',
	});
};

export const runtime = (): CommandRuntime => {
	return {
		execute: async (_context: CommandContext, markupLanguage: MarkupLanguage, markup: string, _rendererOptions: Options = null, renderOptions: RenderOptions = null) => {
			const markupToHtml = getMarkupToHtml();
			const html = await markupToHtml.render(markupLanguage, markup, themeStyle(Setting.value('theme')), {
				...renderOptions,
				resources: await attachedResources(markup),
				splitted: true,
			});
			return html;
		},
	};
};
