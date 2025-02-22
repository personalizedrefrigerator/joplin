import Setting from '@joplin/lib/models/Setting';
import shim from '@joplin/lib/shim';
import Logger from '@joplin/utils/Logger';
import { rtrimSlashes } from '@joplin/utils/path';
import { dirname, join } from 'path';
import { NativeModules } from 'react-native';
import { SpeechToTextCallbacks, VoiceTypingProvider, VoiceTypingSession } from './VoiceTyping';

const logger = Logger.create('voiceTyping/whisper');

const { SpeechToTextModule } = NativeModules;

// Timestamps are in the form <|0.00|>. They seem to be added:
// - After long pauses.
// - Between sentences (in pairs).
// - At the beginning and end of a sequence.
const timestampExp = /<\|(\d+)\|>/g;
const postProcessSpeech = (text: string) => {
	return text.replace(timestampExp, '').replace(/\[BLANK_AUDIO\]/g, '').trim();
};

class Whisper implements VoiceTypingSession {
	private lastPreviewData = '';
	private closeCounter = 0;
	private isFirstParagraph = true;

	public constructor(
		private sessionId: number|null,
		private callbacks: SpeechToTextCallbacks,
	) { }

	private async processData(sessionId: number|null, data: string) {
		if (sessionId === null) {
			logger.info('Session stopped. Not processing data.');
			return;
		}

		const recordingLength = await SpeechToTextModule.getBufferLengthSeconds(sessionId);
		logger.debug('recording length so far', recordingLength, 'with data:', data);

		if (data.length) {
			const prefix = this.isFirstParagraph ? '' : '\n\n';
			this.callbacks.onFinalize(`${prefix}${postProcessSpeech(data)}`);
			this.isFirstParagraph = false;
		}
	}

	public async start() {
		if (this.sessionId === null) {
			throw new Error('Session closed.');
		}
		try {
			logger.debug('starting recorder');
			await SpeechToTextModule.startRecording(this.sessionId);
			logger.debug('recorder started');

			const loopStartCounter = this.closeCounter;
			while (this.closeCounter === loopStartCounter && this.sessionId !== null) {
				logger.debug('reading block');
				const data: string = await SpeechToTextModule.convertNext(this.sessionId, 4);
				await this.processData(this.sessionId, data);

				logger.debug('done reading block. Length', data?.length);
				if (this.sessionId !== null) {
					this.lastPreviewData = await SpeechToTextModule.getPreview(this.sessionId);
					this.callbacks.onPreview(
						postProcessSpeech(this.lastPreviewData),
					);
				}
			}
		} catch (error) {
			logger.error('Whisper error:', error);
			this.lastPreviewData = '';
			await this.stop();
			throw error;
		}
	}

	public async stop() {
		if (this.sessionId === null) {
			logger.debug('Session already closed.');
			return;
		}

		logger.info('Closing session...');
		const sessionId = this.sessionId;
		this.sessionId = null;
		this.closeCounter ++;

		if (this.lastPreviewData) {
			this.callbacks.onFinalize(postProcessSpeech(this.lastPreviewData));
		}

		await SpeechToTextModule.closeSession(sessionId);
	}
}

const modelLocalFilepath = () => {
	return `${shim.fsDriver().getAppDirectoryPath()}/voice-typing-models/ggml-base.bin`;
};

const whisper: VoiceTypingProvider = {
	supported: () => !!SpeechToTextModule,
	modelLocalFilepath: modelLocalFilepath,
	getDownloadUrl: () => {
		let urlTemplate = rtrimSlashes(Setting.value('voiceTypingBaseUrl').trim());

		if (!urlTemplate) {
			urlTemplate = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/{task}.bin?download=true';
		}

		return urlTemplate.replace(/\{task\}/g, 'ggml-base-q8_0');
	},
	deleteCachedModels: async (locale) => {
		await shim.fsDriver().remove(modelLocalFilepath());
		await shim.fsDriver().remove(whisper.getUuidPath(locale));
	},
	getUuidPath: () => {
		return join(dirname(modelLocalFilepath()), 'uuid');
	},
	build: async ({ modelPath, callbacks, locale }) => {
		logger.debug('Creating Whisper session from path', modelPath);
		if (!await shim.fsDriver().exists(modelPath)) throw new Error(`No model found at path: ${JSON.stringify(modelPath)}`);

		const sessionId = await SpeechToTextModule.openSession(modelPath, locale);
		return new Whisper(sessionId, callbacks);
	},
	modelName: 'whisper',
};

export default whisper;
