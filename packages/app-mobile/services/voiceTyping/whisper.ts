import Setting, { Env } from '@joplin/lib/models/Setting';
import shim from '@joplin/lib/shim';
import Logger from '@joplin/utils/Logger';
import { rtrimSlashes } from '@joplin/utils/path';
import { dirname, join } from 'path';
import { NativeModules } from 'react-native';
import { SpeechToTextCallbacks, VoiceTypingProvider, VoiceTypingSession } from './VoiceTyping';
import { languageCodeOnly } from '@joplin/lib/locale';

const logger = Logger.create('voiceTyping/whisper');

const { SpeechToTextModule } = NativeModules;

const postProcessSpeech = (text: string) => {
	text = text.trim();
	text = text.replace(/\[BLANK_AUDIO\]/g, '');
	// Remove non-speech output (e.g. "(music)" or "(silence)")
	text = text.replace(/^(\(|\[)[^()[\].,?]*(\]|\))$/, '');
	// Remove output that is just punctuation (which can happen while processing silence)
	text = text.replace(/^[.,?!]$/, '');
	return text;
};

class Whisper implements VoiceTypingSession {
	private lastPreviewData = '';
	private closeCounter = 0;
	private isFirstParagraph = true;

	public constructor(
		private sessionId: number|null,
		private callbacks: SpeechToTextCallbacks,
	) {
	}

	private async processData(sessionId: number|null, data: string) {
		if (sessionId === null) {
			logger.info('Session stopped. Not processing data.');
			return;
		}

		const recordingLength = await SpeechToTextModule.getBufferLengthSeconds(sessionId);
		logger.debug('recording length so far', recordingLength, 'with data:', data);

		data = postProcessSpeech(data);
		if (data.length) {
			const prefix = this.isFirstParagraph ? '' : '\n\n';
			this.callbacks.onFinalize(`${prefix}${data}`);
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

const getPrompt = (locale: string) => {
	// Different prompts can change the content/quality of the output. See
	// https://cookbook.openai.com/examples/whisper_prompting_guide
	const localeToPrompt = new Map([
		['en', 'Joplin is a note-taking application. This is a Joplin note.'],
		// TODO: Find a better prompt for French (one that seems to produce better output than no prompt)
		// ['fr', 'Joplin est une application. C\'est une note de Joplin.'],
		['es', 'Joplin es una aplicación.'],
	]);
	return localeToPrompt.get(languageCodeOnly(locale)) ?? '';
};

const modelLocalDirectory = () => {
	return `${shim.fsDriver().getAppDirectoryPath()}/voice-typing-models`;
};

const modelLocalFilepath = () => {
	return `${modelLocalDirectory()}/ggml.bin`;
};

const whisper: VoiceTypingProvider = {
	supported: () => !!SpeechToTextModule,
	modelLocalFilepath: modelLocalFilepath,
	getDownloadUrl: () => {
		let urlTemplate = rtrimSlashes(Setting.value('voiceTypingBaseUrl').trim());

		if (!urlTemplate) {
			urlTemplate = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/{task}.bin?download=true';
		}

		// Note: ggml-base-q8_0 is also available and works on many Android devices. On some low
		// resource devices, however, it will fail.
		// TODO: Auto-select the model size?
		return urlTemplate.replace(/\{task\}/g, 'ggml-tiny-q8_0');
	},
	deleteCachedModels: async (locale) => {
		const pathsToRemove = [
			modelLocalFilepath(),
			whisper.getUuidPath(locale),
			// Legacy model filepath
			join(modelLocalDirectory(), 'whisper_tiny.onnx'),
		];

		for (const path of pathsToRemove) {
			if (await shim.fsDriver().exists(path)) {
				await shim.fsDriver().remove(path);
			}
		}
	},
	getUuidPath: () => {
		return join(dirname(modelLocalFilepath()), 'uuid');
	},
	build: async ({ modelPath, callbacks, locale }) => {
		logger.debug('Creating Whisper session from path', modelPath);
		if (!await shim.fsDriver().exists(modelPath)) throw new Error(`No model found at path: ${JSON.stringify(modelPath)}`);


		if (Setting.value('env') === Env.Dev) {
			try {
				await SpeechToTextModule.runTests();
			} catch (error) {
				logger.error('Testing error', error);
				await shim.showErrorDialog(`Test failure: ${error}`);
			}
		}

		const sessionId = await SpeechToTextModule.openSession(modelPath, locale, getPrompt(locale));
		return new Whisper(sessionId, callbacks);
	},
	modelName: 'whisper',
};

export default whisper;
