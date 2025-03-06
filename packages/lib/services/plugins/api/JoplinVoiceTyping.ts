/* eslint-disable multiline-comment-style */

import SpeechToTextService from '../../speechToText/SpeechToTextService';
import { AudioDataSource, SpeechToTextCallbacks, SpeechToTextProvider } from '../../speechToText/types';
import Plugin from '../Plugin';

export type VoiceTypingSessionId = `session-${string}`;

export interface VoiceTypingPluginAttribution {
	text: string;
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

	/** @internal */
	public async getAudioStreamType(sessionId: VoiceTypingSessionId): Promise<AudioDataSource> {
		return this.sessionIdToAudioSource_.get(sessionId);
	}

	/**
	 * Gets the audio input stream for the given voice typing session.
	 *
	 * Voice typing plugins can get data from this stream using, for example,
	 * [AudioContext.createMediaStreamSource](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createMediaStreamSource).
	 */
	public async getAudioStream(_sessionId: VoiceTypingSessionId): Promise<MediaStream> {
		// This must be implemented within the plugin runner webview,
		// since MediaStreams can't be transferred via IPC.
		throw new Error('Not implemented for this platform.');
	}
}
