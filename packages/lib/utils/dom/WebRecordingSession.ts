
const workletUrl: string|null = null;
const getWorkletUrl = () => {
	if (workletUrl) return workletUrl;

	// Approach inspired by https://stackoverflow.com/a/67350383
	// and https://stackoverflow.com/a/77602420.
	const workletSource = `
		"use strict";

		class FetchDataProcessor extends AudioWorkletProcessor {
			process(inputChannels, outputChannels, parameters) {
				// Note: This needs to work in old Android WebView versions, so prefer older
				// JavaScript syntax.
				
				// Returning true keeps the audio worklet alive, even if not actively processing audio data
				if (inputChannels[0]) {
					// TODO: Merge both channels, rather than taking only one.
					const monoAudio = inputChannels[0][0];
					this.port.postMessage({ inputData: monoAudio, sampleRate });
				}
				return true;
			}
		}

		registerProcessor('get-data-worklet', FetchDataProcessor);
	`;
	const workletBlob = new Blob([workletSource], { type: 'application/javascript' });
	return URL.createObjectURL(workletBlob);
};

type AudioSourceFactory = (ctx: AudioContext)=> AudioNode;

export default class WebRecordingSession {
	private audioData_: Float32Array[] = [];
	private bufferedDataDurationSeconds_ = 0;
	private sampleRate_: number; // Samples/seconds
	private audioUpdateListeners_: (()=> void)[] = [];
	private closed_ = false;

	private constructor(private closeStream: ()=> Promise<void>, dataAccessNode: AudioWorkletNode) {
		dataAccessNode.port.onmessage = (event) => {
			const data: unknown = event.data;
			if (typeof data !== 'object' || !('inputData' in data) || !('sampleRate' in data)) {
				throw new Error('Invalid message format (getting audio data).');
			}
			const audioData = data.inputData;
			const sampleRate = data.sampleRate;

			if (!(audioData instanceof Float32Array)) {
				throw new Error(`inputData must be a Float32Array was ${audioData}`);
			}

			if (typeof sampleRate !== 'number') {
				throw new Error('inputData.sampleRate must be a number');
			}

			this.sampleRate_ = sampleRate;
			this.bufferedDataDurationSeconds_ += audioData.length / sampleRate; // samples / (samples/seconds) = seconds
			this.audioData_.push(audioData);
			this.fireAndClearUpdateListeners_();
			this.enforceBufferSizeLimit_();
		};
	}

	private enforceBufferSizeLimit_() {
		// Start trimming data if too much is buffered
		const maxBufferSizeSeconds = 60;
		while (this.bufferedDataDurationSeconds_ > maxBufferSizeSeconds) {
			const firstItem = this.audioData_[0];
			this.bufferedDataDurationSeconds_ -= firstItem.length / this.sampleRate_;
			this.audioData_.splice(0, 1);
		}
	}

	public sampleRate() {
		return this.sampleRate_;
	}

	private fireAndClearUpdateListeners_() {
		const listeners = this.audioUpdateListeners_;
		this.audioUpdateListeners_ = [];
		for (const listener of listeners) {
			listener();
		}
	}

	private getFullAudioBuffer_() {
		let outputLength = 0;
		for (const dataArray of this.audioData_) {
			outputLength += dataArray.length;
		}

		// Build the output array
		const joinedAudio = new Float32Array(outputLength);
		let offset = 0;
		for (const dataArray of this.audioData_) {
			joinedAudio.set(dataArray, offset);
			offset += dataArray.length;
		}
		return joinedAudio;
	}

	public async nextData(targetDurationSeconds: number) {
		const hasEnoughData = () => this.bufferedDataDurationSeconds_ >= targetDurationSeconds || this.closed_;

		while (!hasEnoughData()) {
			await new Promise<void>(resolve => {
				this.audioUpdateListeners_.push(() => resolve());
			});
		}

		const result = this.getFullAudioBuffer_();
		// Clear the buffered data so that future calls will return just new data
		this.audioData_ = [];
		this.bufferedDataDurationSeconds_ = 0;
		return result;
	}

	public async close() {
		if (this.closed_) return;

		await this.closeStream();
		this.closed_ = true;
		this.fireAndClearUpdateListeners_();
	}

	public static async fromMicrophone() {
		this.assertSupported();

		let audioStream;
		try {
			audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
		} catch (error) {
			throw new Error(`Error calling getUserMedia: ${error}`);
		}

		const makeSource: AudioSourceFactory = (audioContext) => {
			return audioContext.createMediaStreamSource(audioStream);
		};
		const onClose = () => {
			for (const track of audioStream.getTracks()) {
				track.stop();
			}
		};
		return this.fromSource(makeSource, onClose);
	}

	private static async fromSource(sourceFactory: AudioSourceFactory, onClose: ()=> void) {
		const audioContext = new AudioContext({
			// Voice typing providers like Whisper and Kroko use a 16000 Hz sample rate,
			// so default to that:
			sampleRate: 16_000,
		});

		try {
			await audioContext.audioWorklet.addModule(getWorkletUrl());
		} catch (error) {
			throw new Error(`Error creating audio worklet for data extraction: ${error}`);
		}
		const source = sourceFactory(audioContext);
		const dataAccessNode = new AudioWorkletNode(audioContext, 'get-data-worklet');
		source.connect(dataAccessNode);

		const closeStream = async () => {
			await audioContext.close();
			onClose();
		};

		return new WebRecordingSession(closeStream, dataAccessNode);
	}

	public static supported() {
		return typeof AudioContext !== 'undefined' && typeof navigator !== 'undefined';
	}

	private static assertSupported() {
		if (!this.supported()) {
			throw new Error('WebRecordingSession is not supported in this context.');
		}
	}
}
