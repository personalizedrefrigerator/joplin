/* eslint-disable multiline-comment-style */

import SpeechToTextService from '../../speechToText/SpeechToTextService';
import { AudioDataSource, SpeechToTextCallbacks, SpeechToTextProvider } from '../../speechToText/types';
import Plugin from '../Plugin';

export type VoiceTypingSessionId = `session-${string}`;

export interface VoiceTypingPluginAttribution {
	libraryName: string;
	url: string;
}

export interface VoiceTypingPlugin {
	/** A short user-facing description of the provider */
	name: string;
	/** A unique ID for the provider */
	id: string;

	/**
	 * Used, for example, to display a "powered by [provider]" link
	 * in the voice typing dialog.
	 */
	attribution?: VoiceTypingPluginAttribution;

	download(): Promise<void>;
	isDownloaded(): Promise<boolean>;
	canUpdateModel(): Promise<boolean>;

	/**
	 * Should remove any cached model data. May be called when the model
	 * experiences an error or crash.
	 */
	clearCache(): Promise<void>;

	onStart(sessionId: VoiceTypingSessionId): Promise<void>;
	onStop(sessionId: VoiceTypingSessionId): Promise<void>;
}

type SessionCloseListener = ()=> void;

export interface AudioSamples {
	sampleRate: number;
	data: Float32Array;
}

/**
 * This module provides cross-platform access to the file system.
 *
 * **Only supported on mobile**.
 */
export default class JoplinVoiceTyping {
	private plugin_: Plugin;
	private nextSessionIdCounter_ = 0;
	private voiceTypingProviders_: SpeechToTextProvider[] = [];
	private sessionIdToAudioSource_: Map<VoiceTypingSessionId, AudioDataSource> = new Map();
	private sessionIdToCallbacks_: Map<VoiceTypingSessionId, SpeechToTextCallbacks> = new Map();
	private sessionCloseListeners_: Map<VoiceTypingSessionId, SessionCloseListener[]> = new Map();

	public constructor(plugin: Plugin) {
		this.plugin_ = plugin;

		plugin.addOnUnloadListener(() => {
			for (const provider of this.voiceTypingProviders_) {
				SpeechToTextService.instance().removeProvider(provider);
			}
		});
	}

	/** Registers a voice typing source. */
	public async registerProvider(voiceTypingProvider: VoiceTypingPlugin) {
		const provider: SpeechToTextProvider = {
			metadata: {
				id: `${this.plugin_.id}-${voiceTypingProvider.id}`,
				name: voiceTypingProvider.name,
				attribution: voiceTypingProvider.attribution ? {
					libraryName: voiceTypingProvider.attribution.libraryName,
					url: voiceTypingProvider.attribution.url,
				} : null,
			},
			getDownloadManager: (_locale) => {
				return {
					download: async () => {
						await voiceTypingProvider.download();
					},
					isDownloaded: async () => {
						return !!await voiceTypingProvider.isDownloaded();
					},
					canUpdateModel: async () => {
						return !!await voiceTypingProvider.canUpdateModel();
					},
					clearCache: async () => {
						await voiceTypingProvider.clearCache();
					},
				};
			},

			start: async ({ dataSource, callbacks }) => {
				const sessionId: VoiceTypingSessionId = `session-${this.nextSessionIdCounter_++}`;
				this.sessionIdToAudioSource_.set(sessionId, dataSource);
				this.sessionIdToCallbacks_.set(sessionId, callbacks);

				await voiceTypingProvider.onStart(sessionId);

				return {
					stop: async () => {
						// Session close listeners are used internally for, among other things,
						// stopping the audio input stream. As a result, they should be called
						// before onStop.
						const sessionCloseListeners = this.sessionCloseListeners_.get(sessionId) ?? [];
						for (const listener of sessionCloseListeners) {
							listener();
						}
						this.sessionCloseListeners_.delete(sessionId);

						await voiceTypingProvider.onStop(sessionId);
						this.sessionIdToCallbacks_.delete(sessionId);
						this.sessionIdToAudioSource_.delete(sessionId);
					},
				};
			},
		};

		SpeechToTextService.instance().addProvider(provider);
		this.voiceTypingProviders_.push(provider);
	}

	/**
	 * Adds `text` to the finalized recognition output for the given session.
	 *
	 * Use `updateRecognitionPreview` when the text is not yet finalized and may
	 * change in the future.
	 */
	public async onTextRecognised(sessionId: VoiceTypingSessionId, text: string) {
		const callbacks = this.sessionIdToCallbacks_.get(sessionId);
		if (!callbacks) {
			throw new Error(`Session not found: ${sessionId}`);
		}

		await callbacks.onFinalize(text);
	}

	/**
	 * Call this when the voice typing provider produces partial results that may
	 * change.
	 */
	public async updateRecognitionPreview(sessionId: VoiceTypingSessionId, preview: string) {
		const callbacks = this.sessionIdToCallbacks_.get(sessionId);
		if (!callbacks) {
			throw new Error(`Could not update preview: Session not found: ${sessionId}`);
		}

		await callbacks.onPreview(preview);
	}

	/**
	 * Add a one-time listener for when a voice typing session is closed.
	 * This is called immediately before .onStop for a voice typing provider.
	 */
	public async addBeforeSessionClosedListener(sessionId: VoiceTypingSessionId, listener: ()=> void) {
		const existingListeners = this.sessionCloseListeners_.get(sessionId);
		if (!existingListeners) {
			this.sessionCloseListeners_.set(sessionId, [listener]);
		} else {
			existingListeners.push(listener);
		}
	}

	/** @internal -- may be used to implement nextAudioData */
	public async getAudioStreamType(sessionId: VoiceTypingSessionId): Promise<AudioDataSource> {
		return this.sessionIdToAudioSource_.get(sessionId);
	}

	/**
	 * Gets the audio input data as a Float32Array.
	 *
	 * This function waits until `durationSeconds` seconds of audio are available before returning.
	 * If less data is available and the stream has closed, the returned data will be shorter than
	 * `durationSeconds`.
	 */
	public async nextAudioData(_sessionId: VoiceTypingSessionId, _durationSeconds: number): Promise<AudioSamples> {
		// This must be implemented within the plugin runner webview,
		// since Float32Arrays can't be transferred efficiently via IPC on all platforms.
		throw new Error('Not implemented for this platform.');
	}
}
