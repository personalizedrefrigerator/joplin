import type { FsDriver as RendererFsDriver, ResourceInfos } from '@joplin/renderer/types';
import type Renderer from './contentScript/Renderer';
import { MarkupLanguage, PluginOptions } from '@joplin/renderer/MarkupToHtml';

export enum RenderingTarget {
	// Renders directly to the body. To limit IPC, does not return the result as a string
	FullPage = 'replace-full-page',
	// Returns a string with the rendered content
	String = 'return-string',
}

// Joplin settings (as from Setting.value(...)) that should
// remain constant during editing.
export interface ForwardedJoplinSettings {
	safeMode: boolean;
	tempDir: string;
	resourceDir: string;
	resourceDownloadMode: string;
}

export interface RendererWebViewOptions {
	settings: ForwardedJoplinSettings;

	// True if asset and resource files should be transferred to the WebView before rendering.
	// This must be true on web, where asset and resource files are virtual and can't be accessed
	// without transferring.
	useTransferredFiles: boolean;

	// Enabled/disabled Markdown plugins
	pluginOptions: PluginOptions;
}

export interface ExtraContentScriptSource {
	id: string;
	js: string;
	assetPath: string;
	pluginId: string;
}

export interface RendererProcessApi {
	renderer: Renderer;
	jumpToHash: (hash: string)=> void;
}

export interface MainProcessApi {
	onScroll(scrollTop: number): void;
	onPostMessage(message: string): void;
	onPostPluginMessage(contentScriptId: string, message: unknown): Promise<unknown>;
	fsDriver: RendererFsDriver;
}

export type OnScrollCallback = (scrollTop: number)=> void;

export interface MarkupRecord {
	language: MarkupLanguage;
	markup: string;
}

export interface RenderOptions {
	themeId: number;
	renderingTarget: RenderingTarget;
	highlightedKeywords: string[];
	resources: ResourceInfos;
	themeOverrides: Record<string, string|number>;

	noteHash: string;
	initialScroll: number;
}

type CancelEvent = { cancelled: boolean };

export interface RendererControl {
	rerender(markup: MarkupRecord, options: RenderOptions, cancelEvent?: CancelEvent): Promise<string|void>;
	clearCache(markupLanguage: MarkupLanguage): void;
}
