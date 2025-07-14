import type { FsDriver as RendererFsDriver } from '@joplin/renderer/types';
import type Renderer from './contentScript/Renderer';

export interface RendererWebViewOptions {
	settings: {
		safeMode: boolean;
		tempDir: string;
		resourceDir: string;
		resourceDownloadMode: string;
	};
	// True if asset and resource files should be transferred to the WebView before rendering.
	// This must be true on web, where asset and resource files are virtual and can't be accessed
	// without transferring.
	useTransferredFiles: boolean;
	pluginOptions: Record<string, unknown>;
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
