import { NativeModules } from "react-native";

type SessionData = {
	recording: boolean;
	locale: string;
};

// `bufferedSpeech` should be a string with timestamps. For example,
// <|0.00|> This is a test. <|3.00|><|3.10|> Test. <|4.00|>
const mockSpeechToTextModule = () => {
	let bufferedSpeech: string = '';
	const sessions = new Map<number, SessionData>();

	const assertIsRecording = (sessionId: number) => {
		if (!sessions.get(sessionId)?.recording) {
			throw new Error(`Session with ID ${sessionId} is not recording.`);
		}
	};

	const timestampExp = /<\|(\d+\.\d+)\|>/g;
	const getTimestamps = () => {
		const result = [];
		for (const timestampMatch of bufferedSpeech.matchAll(timestampExp)) {
			const timestamp = Number(timestampMatch[1]);
			if (timestamp >= 0) {
				result.push({ timestamp, index: timestampMatch.index });
			}
		}
		return result;
	};

	let speechListeners: Array<()=>void> = [];
	const notifyListeners = () => {
		console.log('notify');
		const listeners = speechListeners;
		speechListeners = [];
		for (const listener of listeners) {
			listener();
		}
	};

	let sessionIdCounter = 0;
	let bufferPosition = 0;
	const module = {
		async openSession(_modelPath: string, locale: string) {
			const id = sessionIdCounter ++;
			sessions.set(id, {
				recording: false,
				locale: locale,
			});
			return id;
		},
		startRecording(sessionId: number) {
			if (!sessions.has(sessionId)) {
				throw new Error('Session must be started before recording can start.');
			}
			sessions.get(sessionId).recording = true;
		},
		async expandBufferAndConvert(sessionId: number, length: number) {
			if (this.getBufferLengthSeconds(sessionId) < bufferPosition + length) {
				console.log('waiting');
				const waitForSpeechPromise = new Promise<void>(resolve => {
					speechListeners.push(() => resolve());
				});
				await waitForSpeechPromise;
			}

			bufferPosition += length;

			console.log('speech', bufferedSpeech);
			return bufferedSpeech;
		},
		getBufferLengthSeconds(sessionId: number) {
			assertIsRecording(sessionId);

			const timestamps = getTimestamps();
			const lastTimestamp = timestamps[timestamps.length - 1];
			if (!lastTimestamp) {
				if (bufferedSpeech.length > 0) {
					throw new Error('bufferedSpeech must end with a timestamp.')
				}

				return 0;
			}
			return lastTimestamp.timestamp;
		},
		dropFirstSeconds(sessionId: number, seconds: number) {
			assertIsRecording(sessionId);
			for (const { timestamp, index } of getTimestamps()) {
				if (timestamp > seconds) {
					bufferedSpeech = bufferedSpeech.substring(index);
					break;
				}
			}
			bufferedSpeech.replace(timestampExp, (_fullContent: string, timestamp: string) => {
				return `<|${Number(timestamp) - seconds}|>`;
			});
			bufferPosition = Math.max(bufferPosition - seconds, 0);
		},
		closeSession: (sessionId: number) => {
			assertIsRecording(sessionId);
			notifyListeners();
			sessions.get(sessionId).recording = false;
		},
	};
	NativeModules.SpeechToTextModule = module;

	return {
		module,
		sessions,
		addRecognizedText: (text: string) => {
			bufferedSpeech += text;
			notifyListeners();
		},
	};
};

export default mockSpeechToTextModule;