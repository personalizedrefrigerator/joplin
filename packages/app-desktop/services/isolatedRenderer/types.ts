import type { CachedCssResult } from '@joplin/lib/fs-driver-base';
import type { PluginStates } from '@joplin/lib/services/plugins/reducer';
import type { MarkupLanguage } from '@joplin/renderer/MarkupToHtml';
import type { Options as NoteStyleOptions } from '@joplin/renderer/noteStyle';
import type { RenderResult, RenderResultPluginAsset } from '@joplin/renderer/types';

export interface RendererPluginOptions {
	enabled: boolean;
}

export interface ContentScriptRecord {
	pluginId: string;
	contentScriptId: string;
	script: string;
	assetPath: string;
}

export interface RendererSetupOptions {
	customCss: string;
	resourceBaseUrl: string;
	tempDir: string;
	pluginOptions: Record<string, RendererPluginOptions>;
	isSafeMode: boolean;
	pluginStates: PluginStates;
}

export interface RendererOptions {
	theme: any;
	audioPlayerEnabled: boolean;
	videoPlayerEnabled: boolean;
	pdfViewerEnabled: boolean;
	mapsToLine: boolean;
	noteId: string;
	resources: Record<string, any>;
}

export interface RenderProps {
	markupLanguage: MarkupLanguage;
	markup: string;
	options: RendererOptions;
}

export interface GetAssetsProps {
	markupLanguage: MarkupLanguage;
	theme: any;
	noteStyleOptions: NoteStyleOptions;
}

export type RendererHandle = number;

// For TypeScript to check the serializability of arguments, these
// must be type aliases (and not interfaces).
export interface RendererApi {
	createWithOptions(options: RendererSetupOptions, plugins: ContentScriptRecord[]): Promise<RendererHandle>;

	render(
		renderer: RendererHandle,
		props: RenderProps,
	): Promise<RenderResult>;

	clearCache(renderer: RendererHandle, language: MarkupLanguage): Promise<void>;

	getAssets(
		renderer: RendererHandle,
		props: GetAssetsProps,
	): Promise<RenderResultPluginAsset[]>;

	destroy(renderer: RendererHandle): Promise<void>;
}

export interface MainApi {
	logError(errorMessage: string): Promise<void>;
	cacheCssToFile(cssStrings: string[]): Promise<CachedCssResult>;
}
