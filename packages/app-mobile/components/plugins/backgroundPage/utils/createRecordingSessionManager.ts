import WebRecordingSession from '@joplin/lib/utils/dom/WebRecordingSession';

export interface RecorderInterface {
	nextData(targetDurationSeconds: number): Promise<Float32Array>;
	sampleRate(): number|Promise<number>;
	close(): Promise<void>;
}

type GetAudioRecorderCallback = (sessionId: string)=> Promise<RecorderInterface>;
interface RecordingSessionManager {
	getAudioRecorder: GetAudioRecorderCallback;
	hasAudioRecorder(sessionId: string): boolean;
}

const createRecordingSessionManager = (createFallbackRecorder: GetAudioRecorderCallback): RecordingSessionManager => {
	const mediaRecorders = new Map<string, RecorderInterface>();

	return {
		hasAudioRecorder(sessionId: string) {
			return mediaRecorders.has(sessionId);
		},
		async getAudioRecorder(sessionId: string): Promise<RecorderInterface> {
			const existingRecorder = mediaRecorders.get(sessionId);
			if (existingRecorder) return existingRecorder;

			// Handle the case where, for example, the recorder should be created and managed in
			// a parent frame.
			let recorder = await createFallbackRecorder?.(sessionId);
			// If the parent frame failed to create a recorder, create one in the current frame:
			recorder ??= await WebRecordingSession.fromMicrophone();

			const wrappedRecorder: RecorderInterface = {
				nextData(duration) {
					return recorder.nextData(duration);
				},
				sampleRate() {
					return recorder.sampleRate();
				},
				close() {
					mediaRecorders.delete(sessionId);
					return recorder.close();
				},
			};
			mediaRecorders.set(sessionId, wrappedRecorder);
			return wrappedRecorder;
		},
	};
};

export default createRecordingSessionManager;
