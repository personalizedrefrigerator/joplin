import * as React from 'react';
import { PrimaryButton, SecondaryButton } from '../buttons';
import { _ } from '@joplin/lib/locale';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import Logger from '@joplin/utils/Logger';
import { OnFileSavedCallback, RecorderState } from './types';
import { Platform } from 'react-native';
import shim from '@joplin/lib/shim';
import FsDriverWeb from '../../utils/fs-driver/fs-driver-rn.web';
import uuid from '@joplin/lib/uuid';
import RecordingControls from './RecordingControls';
import { Text } from 'react-native-paper';
import { AndroidAudioEncoder, AndroidOutputFormat, IOSAudioQuality, IOSOutputFormat, RecordingOptions } from 'expo-av/build/Audio';
import time from '@joplin/lib/time';

const logger = Logger.create('AudioRecording');

interface Props {
	onFileSaved: OnFileSavedCallback;
	onDismiss: ()=> void;
}

// Modified from the Expo default recording options to create
// .m4a recordings on both Android and iOS (rather than .3gp on Android).
const recordingOptions: RecordingOptions = {
	isMeteringEnabled: true,
	android: {
		extension: '.m4a',
		outputFormat: AndroidOutputFormat.MPEG_4,
		audioEncoder: AndroidAudioEncoder.AAC,
		sampleRate: 44100,
		numberOfChannels: 2,
		bitRate: 64000,
	},
	ios: {
		extension: '.m4a',
		audioQuality: IOSAudioQuality.MIN,
		outputFormat: IOSOutputFormat.MPEG4AAC,
		sampleRate: 44100,
		numberOfChannels: 2,
		bitRate: 64000,
		linearPCMBitDepth: 16,
		linearPCMIsBigEndian: false,
		linearPCMIsFloat: false,
	},
	web: {
		mimeType: 'audio/webm',
		bitsPerSecond: 128000,
	},
};

const getRecordingFileName = (extension: string) => {
	return `recording-${time.formatDateToLocal(new Date())}${extension}`;
};

const recordingToSaveData = async (recording: Audio.Recording) => {
	let uri = recording.getURI();
	let type: string|undefined;
	let fileName;

	if (Platform.OS === 'web') {
		// On web, we need to fetch the result (which is a blob URL) and save it in our
		// virtual file system so that it can be processed elsewhere.
		const fetchResult = await fetch(uri);
		const blob = await fetchResult.blob();

		// expo-av records to webm format on web
		fileName = getRecordingFileName('.webm');
		const file = new File([blob], fileName);
		type = 'audio/webm';

		const path = `/tmp/${uuid.create()}-${fileName}`;
		await (shim.fsDriver() as FsDriverWeb).createReadOnlyVirtualFile(path, file);
		uri = path;
	} else {
		const extension = Platform.select({
			android: recordingOptions.android.extension,
			ios: recordingOptions.ios.extension,
			default: '',
		});
		fileName = getRecordingFileName(extension);
	}

	return { uri, fileName, type };
};

const useAudioRecorder = (onFileSaved: OnFileSavedCallback, onDismiss: ()=> void) => {
	const [permissionResponse, requestPermission] = Audio.usePermissions();
	const [recordingState, setRecordingState] = useState<RecorderState>(RecorderState.Idle);
	const [error, setError] = useState('');
	const [duration, setDuration] = useState(0);

	const recordingRef = useRef<Audio.Recording|null>();
	const onStartRecording = useCallback(async () => {
		try {
			setRecordingState(RecorderState.Loading);
			if (permissionResponse?.status !== 'granted') {
				const response = await requestPermission();
				if (!response.granted) {
					throw new Error(_('Missing permission to record audio.'));
				}
			}

			await Audio.setAudioModeAsync({
				allowsRecordingIOS: true,
			});
			setRecordingState(RecorderState.Recording);
			const recording = new Audio.Recording();
			await recording.prepareToRecordAsync(recordingOptions);
			recording.setOnRecordingStatusUpdate(status => {
				setDuration(status.durationMillis);
			});
			recordingRef.current = recording;
			await recording.startAsync();
		} catch (error) {
			logger.error('Error starting recording:', error);
			setError(`Recording error: ${error}`);
			setRecordingState(RecorderState.Error);

			void recordingRef.current?.stopAndUnloadAsync();
			recordingRef.current = null;
		}
	}, [permissionResponse, requestPermission]);

	const onStopRecording = useCallback(async () => {
		const recording = recordingRef.current;
		recordingRef.current = null;
		setRecordingState(RecorderState.Idle);
		await recording.stopAndUnloadAsync();

		await Audio.setAudioModeAsync({
			allowsRecordingIOS: false,
		});

		const saveEvent = await recordingToSaveData(recording);
		onFileSaved(saveEvent);
		onDismiss();
	}, [onFileSaved, onDismiss]);

	const onStartStopRecording = useCallback(async () => {
		if (recordingState === RecorderState.Idle) {
			await onStartRecording();
		} else if (recordingState === RecorderState.Recording && recordingRef.current) {
			await onStopRecording();
		}
	}, [recordingState, onStartRecording, onStopRecording]);

	useEffect(() => () => {
		if (recordingRef.current) {
			void recordingRef.current?.stopAndUnloadAsync();
			recordingRef.current = null;
		}
	}, []);

	return { onStartStopRecording, error, duration, recordingState };
};

const AudioRecording: React.FC<Props> = props => {
	const { recordingState, onStartStopRecording, duration, error } = useAudioRecorder(props.onFileSaved, props.onDismiss);

	const startStopButtonLabel = recordingState === RecorderState.Idle ? _('Start recording') : _('Done');
	const allowStartStop = recordingState === RecorderState.Idle || recordingState === RecorderState.Recording;
	const actions = <>
		<SecondaryButton onPress={props.onDismiss}>{_('Cancel')}</SecondaryButton>
		<PrimaryButton disabled={!allowStartStop} onPress={onStartStopRecording}>{startStopButtonLabel}</PrimaryButton>
	</>;

	const durationDescription = <Text>{
		recordingState === RecorderState.Recording
			? _('%ds', Math.floor(duration / 1000))
			: ''
	}</Text>;

	return <RecordingControls
		recorderState={recordingState}
		heading={recordingState === RecorderState.Recording ? _('Recording...') : _('Voice recorder')}
		content={
			recordingState === RecorderState.Idle
				? _('Click "start" to attach a new voice memo to the note.')
				: error
		}
		preview={durationDescription}
		actions={actions}
	/>;
};

export default AudioRecording;
