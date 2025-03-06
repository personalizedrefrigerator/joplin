import { AudioDataSource } from '../../speechToText/types';
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
    private pluginId_;
    private nextSessionIdCounter_;
    private voiceTypingProviders_;
    private sessionIdToAudioSource_;
    private sessionIdToCallbacks_;
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
    /** @internal */
    getAudioStreamType(sessionId: VoiceTypingSessionId): Promise<AudioDataSource>;
    /**
     * Gets the audio input stream for the given voice typing session.
     *
     * Voice typing plugins can get data from this stream using, for example,
     * [AudioContext.createMediaStreamSource](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createMediaStreamSource).
     */
    getAudioStream(_sessionId: VoiceTypingSessionId): Promise<MediaStream>;
}
