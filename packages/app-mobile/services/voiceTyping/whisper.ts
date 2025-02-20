import Setting from '@joplin/lib/models/Setting';
import shim from '@joplin/lib/shim';
import Logger from '@joplin/utils/Logger';
import { rtrimSlashes } from '@joplin/utils/path';
import { dirname, join } from 'path';
import { NativeModules } from 'react-native';
import { SpeechToTextCallbacks, VoiceTypingProvider, VoiceTypingSession } from './VoiceTyping';
import splitWhisperText from './utils/splitWhisperText';

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
	private lastPreviewData: string;
	private modelPrompt = '';
	private closeCounter = 0;

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
		logger.debug('recording length so far', recordingLength);
		const { trimTo, dataBeforeTrim, dataAfterTrim } = splitWhisperText(data, recordingLength);

		if (trimTo > 2) {
			logger.debug('Trim to', trimTo, 'in recording with length', recordingLength);
			const dataBefore = postProcessSpeech(dataBeforeTrim);
			this.callbacks.onFinalize(dataBefore);
			this.callbacks.onPreview(postProcessSpeech(dataAfterTrim));
			this.lastPreviewData = dataAfterTrim;
			await SpeechToTextModule.dropFirstSeconds(sessionId, trimTo);

			// The previous output is used as a prompt for the next output.
			this.modelPrompt += ` ${dataBefore}`;
			// Keep only the last 150 chars
			this.modelPrompt = this.modelPrompt.substring(Math.max(0, this.modelPrompt.length - 150), 150);
		} else {
			logger.debug('Preview', data);
			this.lastPreviewData = data;
			this.callbacks.onPreview(postProcessSpeech(data));
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
				const data: string = await SpeechToTextModule.expandBufferAndConvert(this.sessionId, 4, this.modelPrompt);
				logger.debug('done reading block. Length', data?.length);
				await this.processData(this.sessionId, data);
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

		try {
			// Process any remaining data
			logger.debug('ConvertAvailable');
			const lastData = await SpeechToTextModule.convertAvailable(sessionId, this.modelPrompt);
			logger.debug('Process');
			await this.processData(sessionId, lastData);

			if (this.lastPreviewData) {
				this.callbacks.onFinalize(postProcessSpeech(this.lastPreviewData));
			}
		} finally {
			this.closeCounter ++;
			this.modelPrompt = '';
			await SpeechToTextModule.closeSession(sessionId);
		}
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
