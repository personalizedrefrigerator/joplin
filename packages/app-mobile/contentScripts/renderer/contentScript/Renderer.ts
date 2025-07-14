import { MarkupLanguage, MarkupToHtml } from '@joplin/renderer';
import type { MarkupToHtmlConverter, RenderOptions, RenderResultPluginAsset, FsDriver as RendererFsDriver, ResourceInfos } from '@joplin/renderer/types';
import makeResourceModel from './utils/makeResourceModel';
import addPluginAssets from './utils/addPluginAssets';
import { ExtraContentScriptSource } from '../types';
import { ExtraContentScript } from '@joplin/lib/services/plugins/utils/loadContentScripts';
import { RendererWebViewOptions } from '../types';

export interface RendererSetupOptions extends RendererWebViewOptions {
	fsDriver: RendererFsDriver;
}

export interface RendererSettings {
	theme: string;
	onResourceLoaded: ()=> void;
	highlightedKeywords: string[];
	resources: ResourceInfos;
	codeTheme: string;
	noteHash: string;
	initialScroll: number;

	createEditPopupSyntax: string;
	destroyEditPopupSyntax: string;

	pluginSettings: Record<string, unknown>;
	requestPluginSetting: (pluginId: string, settingKey: string)=> void;
	readAssetBlob: (assetPath: string)=> Promise<Blob>;
}

export interface RendererOutput {
	getOutputElement: ()=> HTMLElement;
	afterRender: (setupOptions: RendererSetupOptions, renderSettings: RendererSettings)=> void;
}

export interface MarkupRecord {
	language: MarkupLanguage;
	markup: string;
}

export default class Renderer {
	private markupToHtml_: MarkupToHtmlConverter;
	private lastSettings_: RendererSettings|null = null;
	private extraContentScripts_: ExtraContentScript[] = [];
	private lastRenderMarkup_: MarkupRecord|null = null;
	private resourcePathOverrides_: Record<string, string> = Object.create(null);

	public constructor(private output_: RendererOutput, private setupOptions_: RendererSetupOptions) {
		this.recreateMarkupToHtml_();
	}

	private recreateMarkupToHtml_() {
		this.markupToHtml_ = new MarkupToHtml({
			extraRendererRules: this.extraContentScripts_,
			fsDriver: this.setupOptions_.fsDriver,
			isSafeMode: this.setupOptions_.settings.safeMode,
			tempDir: this.setupOptions_.settings.tempDir,
			ResourceModel: makeResourceModel(this.setupOptions_.settings.resourceDir),
			pluginOptions: this.setupOptions_.pluginOptions,
		});
	}

	// Intended for web, where resources can't be linked to normally.
	public async setResourceFile(id: string, file: Blob) {
		this.resourcePathOverrides_[id] = URL.createObjectURL(file);
	}

	public getResourcePathOverride(resourceId: string) {
		if (Object.prototype.hasOwnProperty.call(this.resourcePathOverrides_, resourceId)) {
			return this.resourcePathOverrides_[resourceId];
		}
		return null;
	}

	public async setExtraContentScriptsAndRerender(
		extraContentScripts: ExtraContentScriptSource[],
	) {
		this.extraContentScripts_ = extraContentScripts.map(script => {
			const scriptModule = ((0, eval)(script.js))({
				pluginId: script.pluginId,
				contentScriptId: script.id,
			});

			if (!scriptModule.plugin) {
				throw new Error(`
					Expected content script ${script.id} to export a function that returns an object with a "plugin" property.
					Found: ${scriptModule}, which has keys ${Object.keys(scriptModule)}.
				`);
			}

			return {
				...script,
				module: scriptModule,
			};
		});
		this.recreateMarkupToHtml_();

		// If possible, rerenders with the last rendering settings. The goal
		// of this is to reduce the number of IPC calls between the viewer and
		// React Native. We want the first render to be as fast as possible.
		if (this.lastRenderMarkup_) {
			await this.rerender(this.lastRenderMarkup_, this.lastSettings_);
		}
	}

	public async rerender(markup: MarkupRecord, settings: RendererSettings) {
		this.lastSettings_ = settings;
		this.lastRenderMarkup_ = markup;

		const options: RenderOptions = {
			onResourceLoaded: settings.onResourceLoaded,
			highlightedKeywords: settings.highlightedKeywords,
			resources: settings.resources,
			codeTheme: settings.codeTheme,
			postMessageSyntax: 'window.joplinPostMessage_',
			enableLongPress: true,

			// Show an 'edit' popup over SVG images
			editPopupFiletypes: ['image/svg+xml'],
			createEditPopupSyntax: settings.createEditPopupSyntax,
			destroyEditPopupSyntax: settings.destroyEditPopupSyntax,
			itemIdToUrl: this.setupOptions_.useTransferredFiles ? (id: string) => this.getResourcePathOverride(id) : undefined,

			settingValue: (pluginId: string, settingName: string) => {
				const settingKey = `${pluginId}.${settingName}`;

				if (!(settingKey in settings.pluginSettings)) {
					// This should make the setting available on future renders.
					settings.requestPluginSetting(pluginId, settingName);
					return undefined;
				}

				return settings.pluginSettings[settingKey];
			},
			whiteBackgroundNoteRendering: markup.language === MarkupLanguage.Html,
		};

		this.markupToHtml_.clearCache(markup.language);

		const contentContainer = this.output_.getOutputElement();

		let html = '';
		let pluginAssets: RenderResultPluginAsset[] = [];
		try {
			const result = await this.markupToHtml_.render(
				markup.language,
				markup.markup,
				JSON.parse(settings.theme),
				options,
			);
			html = result.html;
			pluginAssets = result.pluginAssets;
		} catch (error) {
			if (!contentContainer) {
				alert(`Renderer error: ${error}`);
			} else {
				contentContainer.textContent = `
					Error: ${error}
					
					${error.stack ?? ''}
				`;
			}
			throw error;
		}

		contentContainer.innerHTML = html;

		// Adding plugin assets can be slow -- run it asynchronously.
		void (async () => {
			await addPluginAssets(pluginAssets, {
				inlineAssets: this.setupOptions_.useTransferredFiles,
				readAssetBlob: settings.readAssetBlob,
			});

			// Some plugins require this event to be dispatched just after being added.
			document.dispatchEvent(new Event('joplin-noteDidUpdate'));
		})();

		this.afterRender(settings);

		return html;
	}

	private afterRender(renderSettings: RendererSettings) {
		this.output_.afterRender(this.setupOptions_, renderSettings);
	}

	public clearCache(markupLanguage: MarkupLanguage) {
		this.markupToHtml_.clearCache(markupLanguage);
	}

	private extraCssElements: Record<string, HTMLStyleElement> = {};
	public setExtraCss(key: string, css: string) {
		if (this.extraCssElements.hasOwnProperty(key)) {
			this.extraCssElements[key].remove();
		}

		const extraCssElement = document.createElement('style');
		extraCssElement.appendChild(document.createTextNode(css));
		document.head.appendChild(extraCssElement);

		this.extraCssElements[key] = extraCssElement;
	}
}
