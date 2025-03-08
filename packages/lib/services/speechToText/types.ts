export type OnTextCallback = (text: string)=> void;

export interface SpeechToTextCallbacks {
	// Called with a block of text that might change in the future
	onPreview: OnTextCallback;
	// Called with text that will not change and should be added to the document
	onFinalize: OnTextCallback;
}

export enum AudioDataSourceType {
	Resource = 'resource',
	Microphone = 'mic',
}

interface MicrophoneDataSource {
	kind: AudioDataSourceType.Microphone;
}

interface ResourceDataSource {
	kind: AudioDataSourceType.Resource;
	id: string;
}

export type AudioDataSource = MicrophoneDataSource|ResourceDataSource;

export interface SpeechToTextAttribution {
	libraryName: string;
	url: string;
}

export interface SpeechToTextProviderMetadata {
	id: string;
	name: string;
	attribution: SpeechToTextAttribution|null;
}

export interface SpeechToTextDownloadManager {
	download(): Promise<void>;
	isDownloaded(): Promise<boolean>;
	canUpdateModel(): Promise<boolean>;
	clearCache(): Promise<void>;
}

export interface SpeechToTextSession {
	stop(): Promise<void>;
}

export interface SessionStartOptions {
	dataSource: AudioDataSource;
	locale: string;
	callbacks: SpeechToTextCallbacks;
}

export interface SpeechToTextProvider {
	metadata: SpeechToTextProviderMetadata;
	getDownloadManager(locale: string): SpeechToTextDownloadManager;

	start(options: SessionStartOptions): Promise<SpeechToTextSession>;
}
