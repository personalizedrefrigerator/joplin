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

export enum SandboxMessageType {
	// main -> sandbox
	SetOptions,
	Render,
	GetAssets,
	ClearCache,

	// sandbox -> main
	SandboxLoaded,
	RenderResult,
	AssetsResult,
	OptionsLoaded,
	Error,
}

// Messages from the main process to the iframe
//
interface SetOptionsMessage {
	kind: SandboxMessageType.SetOptions;
	options: RendererSetupOptions;

	// It seems that even if `plugins: []` is passed, plugins can be null
	// in iframe.ts.
	plugins?: ContentScriptRecord[];

	responseId: string;
}

export interface RenderMessage {
	kind: SandboxMessageType.Render;
	markup: string;
	markupLanguage: MarkupLanguage;
	options: RendererOptions;

	// should be a unique identifier, allowing a RenderResultMessage
	// to be associated with this RenderMessage.
	responseId: string;
}

interface ClearCacheMessage {
	kind: SandboxMessageType.ClearCache;
	language: MarkupLanguage;
}

interface GetAssetsMessage {
	kind: SandboxMessageType.GetAssets;
	language: MarkupLanguage;
	theme: any;
	noteStyleOptions: NoteStyleOptions;

	responseId: string;
}

export type MainToSandboxMessage = RenderMessage|SetOptionsMessage|GetAssetsMessage|ClearCacheMessage;

// Messages from the iframe to the main process that are in response
// to a MainToSandboxMessage
interface SandboxResponse {
	responseId: string;
}

interface RenderResultMessage extends SandboxResponse {
	kind: SandboxMessageType.RenderResult;
	result: RenderResult;
}

interface ErrorMessage extends SandboxResponse {
	kind: SandboxMessageType.Error;
	errorMessage: string;

	// If the result of the callback was unusable or not
	// (if NOT unusable, the listener should expect another
	// message).
	unusable: boolean;
}

interface SandboxLoadedMessage {
	kind: SandboxMessageType.SandboxLoaded;

	// Not a response
	responseId: undefined;
}

interface OptionsLoadSuccessMessage extends SandboxResponse {
	kind: SandboxMessageType.OptionsLoaded;
}

interface AssetsResult extends SandboxResponse {
	kind: SandboxMessageType.AssetsResult;
	assets: RenderResultPluginAsset[];
}

export type SandboxToMainMessage = RenderResultMessage|ErrorMessage|SandboxLoadedMessage|OptionsLoadSuccessMessage|AssetsResult;

