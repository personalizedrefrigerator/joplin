import MarkupToHtml, { MarkupLanguage } from '@joplin/renderer/MarkupToHtml';
import { join } from 'path';
import { MarkupToHtmlConverter, RenderResult } from '@joplin/renderer/types';
import { Options as NoteStyleOptions } from '@joplin/renderer/noteStyle';
import readPluginFiles from './utils/readPluginFiles';
import { MainApi, RendererApi, RendererHandle, RendererSetupOptions } from './types';
import WindowMessenger from './messenger/WindowMessenger';
import Logger from '@joplin/utils/Logger';
import shim from '@joplin/lib/shim';

const logger = Logger.create('IsolatedMarkupToHtml');

let iframeMessenger: WindowMessenger<MainApi, RendererApi>|null = null;

// Creates a single shared, sandboxed iframe to be used for markup rendering.
export default class IsolatedMarkupToHtml implements MarkupToHtmlConverter {
	private remoteApi: RendererApi;
	private sandboxInitializationPromise: Promise<void>;
	private rendererHandle: RendererHandle;

	// We keep an unsandboxed MarkupToHtml for synchronous calls that do
	// not need access to plugins.
	private unsandboxedMarkupToHtml: MarkupToHtmlConverter|null = null;

	public constructor(globalOptions: RendererSetupOptions) {
		// Create the shared iframe if needed
		if (!iframeMessenger) {
			const iframe = document.createElement('iframe');
			iframe.src = join(__dirname, 'renderer', 'index.html');

			// Note: Do not enable both allow-scripts and allow-same-origin as this
			// breaks the sandbox. See
			// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe
			iframe.setAttribute('sandbox', 'allow-scripts');

			// We need to add the iframe to the document for it to load
			document.documentElement.appendChild(iframe);
			iframe.style.display = 'none';

			iframeMessenger = new WindowMessenger<MainApi, RendererApi>(iframe.contentWindow, {
				logError: async (errorMessage: string) => {
					logger.error(errorMessage);
				},
				cacheCssToFile: async (cssStrings: string[]) => {
					return shim.fsDriver().cacheCssToFile(cssStrings);
				},
			});
		}

		this.remoteApi = iframeMessenger.remoteApi;

		// Run async setup -- initialize the renderer and send plugin data that needs to be
		// loaded in the main process.
		this.sandboxInitializationPromise = (async () => {
			const plugins = await readPluginFiles(globalOptions.pluginStates);
			this.rendererHandle = await this.remoteApi.createWithOptions(globalOptions, plugins);
		})();
	}

	public async destroy() {
		await this.sandboxInitializationPromise;

		await this.remoteApi.destroy(this.rendererHandle);
	}

	public async clearCache(markupLanguage: MarkupLanguage) {
		await this.sandboxInitializationPromise;
		await this.remoteApi.clearCache(this.rendererHandle, markupLanguage);
	}

	public async render(
		markupLanguage: MarkupLanguage, markup: string, theme: any, options: any,
	): Promise<RenderResult> {
		await this.sandboxInitializationPromise;

		// Filter the options to ensure that only transferable options are sent.
		const rendererOptions = {
			theme,
			audioPlayerEnabled: options.audioPlayerEnabled ?? true,
			videoPlayerEnabled: options.videoPlayerEnabled ?? true,
			pdfViewerEnabled: options.pdfViewerEnabled ?? true,
			mapsToLine: options.mapsToLine ?? false,
			noteId: options.noteId,
			resources: options.resources,
		};

		return await this.remoteApi.render(this.rendererHandle, {
			markupLanguage,
			markup,
			options: rendererOptions,
		});
	}

	public stripMarkup(markupLanguage: MarkupLanguage, markup: string, options: any): string {
		// This method is synchronous. As such, we can't pass messages to the renderer.
		// Do everything with a MarkupToHtml that has no plugins.
		this.unsandboxedMarkupToHtml ??= new MarkupToHtml();

		// Pass only collapseWhiteSpaces to prevent accidental rendering
		// with plugins.
		const stripMarkupOptions = {
			collapseWhiteSpaces: options.collapseWhiteSpaces,
		};

		return this.unsandboxedMarkupToHtml.stripMarkup(
			markupLanguage,
			markup,
			stripMarkupOptions,
		);
	}

	public async allAssets(markupLanguage: MarkupLanguage, theme: any, noteStyleOptions: NoteStyleOptions) {
		await this.sandboxInitializationPromise;

		return await this.remoteApi.getAssets(this.rendererHandle, {
			markupLanguage, theme, noteStyleOptions,
		});
	}
}
