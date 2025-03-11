import { AudioDataSource } from '../../speechToText/types';
import Plugin from '../Plugin';
export type VoiceTypingSessionId = `session-${string}`;
export interface VoiceTypingPluginAttribution {
    libraryName: string;
    url: string;
}
export interface VoiceTypingSessionInfo {
    /**
     * The predicted language for voice typing based on the user's settings.
     * For example, `en_US`.
     */
    locale: string;
    /**
     * A URL pattern for downloading the model requested by the user in Joplin's settings.
     * Shared for all voice typing providers and may be ignored.
     */
    downloadUrlTemplate: string;
}
export interface VoiceTypingPlugin {
    /** A short user-facing description of the provider */
    name: string;
    /** A unique ID for the provider */
    id: string;
    /**
     * An array of language codes supported by the plugin (e.g. `en` for English).
     * Set to `['*']` to mark all languages as supported.
     */
    supportedLanguages: string[];
    /**
     * Used, for example, to display a "powered by [provider]" link
     * in the voice typing dialog.
     */
    attribution?: VoiceTypingPluginAttribution;
    download(options: VoiceTypingSessionInfo): Promise<void>;
    isDownloaded(options: VoiceTypingSessionInfo): Promise<boolean>;
    canUpdateModel(options: VoiceTypingSessionInfo): Promise<boolean>;
    /**
     * Should remove any cached model data. May be called when the model
     * experiences an error or crash.
     */
    clearCache(options: VoiceTypingSessionInfo): Promise<void>;
    onStart(sessionId: VoiceTypingSessionId, options: VoiceTypingSessionInfo): Promise<void>;
    onStop(sessionId: VoiceTypingSessionId): Promise<void>;
}
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
    private plugin_;
    private nextSessionIdCounter_;
    private voiceTypingProviders_;
    private sessionIdToAudioSource_;
    private sessionIdToCallbacks_;
    private sessionCloseListeners_;
    constructor(plugin: Plugin);
    /** Registers a voice typing source. */
    registerProvider(voiceTypingProvider: VoiceTypingPlugin): Promise<void>;
    /**
     * Adds `text` to the finalized recognition output for the given session.
     *
     * Use `updateRecognitionPreview` when the text is not yet finalized and may
     * change in the future.
     */
    onTextRecognised(sessionId: VoiceTypingSessionId, text: string): Promise<void>;
    /**
     * Call this when the voice typing provider produces partial results that may
     * change.
     */
    updateRecognitionPreview(sessionId: VoiceTypingSessionId, preview: string): Promise<void>;
    /**
     * Add a one-time listener for when a voice typing session is closed.
     * This is called immediately before .onStop for a voice typing provider.
     */
    addBeforeSessionClosedListener(sessionId: VoiceTypingSessionId, listener: () => void): Promise<void>;
    /** @internal -- may be used to implement nextAudioData */
    getAudioStreamType(sessionId: VoiceTypingSessionId): Promise<AudioDataSource>;
    /**
     * Gets the audio input data as a Float32Array.
     *
     * This function waits until `durationSeconds` seconds of audio are available before returning.
     * If less data is available and the stream has closed, the returned data will be shorter than
     * `durationSeconds`.
     */
    nextAudioData(_sessionId: VoiceTypingSessionId, _durationSeconds: number): Promise<AudioSamples>;
}
