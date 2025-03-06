
import ApiGlobal from '@joplin/lib/services/plugins/api/Global';
import { SerializableData } from '@joplin/lib/utils/ipc/types';

export enum LogLevel {
	Error = 'error',
	Warn = 'warn',
	Info = 'info',
	Debug = 'debug',
}

export enum ReadFileMethod {
	XmlHttpRequest = 'fetch-with-xml-http-request',
	Disallow = 'disallow',
}

type ReadFileAction = {
	kind: ReadFileMethod.XmlHttpRequest;
	url: string;
}|{
	kind: ReadFileMethod.Disallow;
};

export type ReadFileBlobResult = Blob|ReadFileAction;

export interface PluginMainProcessApi {
	api: ApiGlobal;
	onError: (message: string)=> Promise<void>;
	onLog: (level: LogLevel, message: string)=> Promise<void>;

	// On some platforms, it's efficient to send a Blob over IPC. In other cases, it's
	// more efficient to fetch a blob using a different method. If sending the Blob over IPC is most
	// feasible, this method returns the Blob directly. Otherwise, it suggests an action for the
	// WebView logic to take.
	readFileBlob: (path: string)=> Promise<ReadFileBlobResult>;
}

export interface PluginWebViewApi {

}

// Similar to PluginViewState, but with loaded scripts (rather than
// paths to scripts).
export interface DialogInfo {
	id: string;
	opened: boolean;
	fitToContent: boolean;
	contentScripts: string[];
	contentCss: string[];
	html: string;
}

export type WebViewPostMessageCallback = (message: SerializableData)=> Promise<SerializableData>;

// To be compatible with the desktop app, onMessage handlers registered within a dialog
// or panel are given an event with a message property.
interface OnMessageEvent {
	message: SerializableData;
}
export type DialogOnMessageListener = (event: OnMessageEvent)=> Promise<void|SerializableData>;
export type DialogSetOnMessageListenerCallback = (onMessage: DialogOnMessageListener)=> Promise<void>;

export interface DialogMainProcessApi {
	postMessage: WebViewPostMessageCallback;
	onMessage: DialogSetOnMessageListenerCallback;
	onError: (message: string)=> Promise<void>;
	onLog: (level: LogLevel, message: string)=> Promise<void>;
}

export interface DialogContentSize {
	width: number;
	height: number;
}

export interface DialogWebViewApi {
	// Note: Includes any path at most once (calling again with the same paths
	//       does not reload styles/scripts).
	includeCssFiles: (paths: string[])=> Promise<void>;
	includeJsFiles: (paths: string[])=> Promise<void>;
	runScript: (key: string, content: string)=> Promise<void>;

	setThemeCss: (css: string)=> Promise<void>;
	getFormData: ()=> Promise<SerializableData>;
	getContentSize: ()=> Promise<DialogContentSize>;
}
