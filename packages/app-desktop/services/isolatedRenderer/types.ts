import { PluginStates } from '@joplin/lib/services/plugins/reducer';
import type { MarkupLanguage } from '@joplin/renderer/MarkupToHtml';
import { RenderResult } from '@joplin/renderer/types';

export interface RendererPluginOptions {
	enabled: boolean;
}

export interface RendererSetupOptions {
	customCss: string;
	resourceBaseUrl: string;
	tempDir: string;
	pluginOptions: Record<string, RendererPluginOptions>;
	isSafeMode: boolean;
}

export interface RendererOptions {
	theme: any;
	audioPlayerEnabled: boolean;
	videoPlayerEnabled: boolean;
	pdfViewerEnabled: boolean;
	noteId: string;
}

export enum SandboxMessageType {
	// main -> sandbox
	SetOptions,
	Render,
	SetPlugins,
	ClearCache,

	// sandbox -> main
	SandboxLoaded,
	RenderResult,
	Error,
}

// Messages from the main process to the iframe
//
export interface SetOptionsMessage {
	kind: SandboxMessageType.SetOptions;
	options: RendererSetupOptions;
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

export interface SetPluginsMessage {
	kind: SandboxMessageType.SetPlugins;
	plugins: PluginStates;
}

export interface ClearCacheMessage {
	kind: SandboxMessageType.ClearCache;
	language: MarkupLanguage;
}

export type MainToSandboxMessage = RenderMessage|SetOptionsMessage|SetPluginsMessage|ClearCacheMessage;

// Messages from the iframe to the main process that are in response
// to a MainToSandboxMessage
interface SandboxResponse {
	responseId: string;
}

export interface RenderResultMessage extends SandboxResponse {
	kind: SandboxMessageType.RenderResult;
	result: RenderResult;
}

export interface ErrorMessage extends SandboxResponse {
	kind: SandboxMessageType.Error;
	errorMessage: string;
}

export interface SandboxLoadedMessage {
	kind: SandboxMessageType.SandboxLoaded;

	// Not a response
	responseId: undefined;
}

export type SandboxToMainMessage = RenderResultMessage|ErrorMessage|SandboxLoadedMessage;

