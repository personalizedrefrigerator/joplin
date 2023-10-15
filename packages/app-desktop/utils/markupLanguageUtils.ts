import { MarkupLanguageUtils as BaseMarkupLanguageUtils } from '@joplin/lib/markupLanguageUtils';
import Setting from '@joplin/lib/models/Setting';
import { PluginStates } from '@joplin/lib/services/plugins/reducer';
// import { contentScriptsToRendererRules } from '@joplin/lib/services/plugins/utils/loadContentScripts';
import { Options } from '@joplin/renderer/MarkupToHtml';
import IsolatedMarkupToHtml from '../services/isolatedRenderer/IsolatedMarkupToHtml';
import { RendererPluginOptions, RendererSetupOptions } from '../services/isolatedRenderer/types';

class MarkupLanguageUtils extends BaseMarkupLanguageUtils {

	public newMarkupToHtml(plugins: PluginStates = null, options: Options = null) {
		plugins = plugins || {};

		const subValues = Setting.subValues('markdown.plugin', Setting.toPlainObject());
		const pluginOptions: Record<string, RendererPluginOptions> = {};
		for (const n in subValues) {
			pluginOptions[n] = { enabled: subValues[n] };
		}

		const renderOptions: RendererSetupOptions = {
			pluginOptions: pluginOptions,
			tempDir: Setting.value('tempDir'),
			isSafeMode: Setting.value('isSafeMode'),
			customCss: options.customCss ?? '',
			resourceBaseUrl: options.resourceBaseUrl ?? `file://${Setting.value('resourceDir')}/`,
			pluginStates: plugins,
		};

		return new IsolatedMarkupToHtml(renderOptions);
	}

}

const markupLanguageUtils = new MarkupLanguageUtils();

export default markupLanguageUtils;
