import * as React from 'react';
import { PrimaryButton } from '../buttons';
import { _ } from '@joplin/lib/locale';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import Logger from '@joplin/utils/Logger';
import { OnFileSavedCallback } from './types';
import { Platform } from 'react-native';
import shim from '@joplin/lib/shim';
import FsDriverWeb from '../../utils/fs-driver/fs-driver-rn.web';
import uuid from '@joplin/lib/uuid';

const logger = Logger.create('AudioRecording');

interface Props {
	onFileSaved: OnFileSavedCallback;
	onDismiss: ()=> void;
}

enum RecordingState {
	NotStarted,
	Starting,
	Recording,
}

const recordingOptions = Audio.RecordingOptionsPresets.LOW_QUALITY;

const AudioRecording: React.FC<Props> = props => {
	const [permissionResponse, requestPermission] = Audio.usePermissions();
	const [recordingState, setRecordingState] = useState<RecordingState>(RecordingState.NotStarted);
	const recordingRef = useRef<Audio.Recording|null>();
	const onStartStopRecording = useCallback(async () => {
		if (recordingState === RecordingState.NotStarted) {
			try {
				setRecordingState(RecordingState.Starting);
				if (permissionResponse?.status !== 'granted') {
					await requestPermission();
				}
				await Audio.setAudioModeAsync({
					allowsRecordingIOS: true,
				});
				setRecordingState(RecordingState.Recording);
				const recording = new Audio.Recording();
				await recording.prepareToRecordAsync(recordingOptions);
				recordingRef.current = recording;
				await recording.startAsync();
			} catch (error) {
				logger.error('Error starting recording:', error);
				setRecordingState(RecordingState.NotStarted);
				void recordingRef.current?.stopAndUnloadAsync();
				recordingRef.current = null;
			}
		} else if (recordingState === RecordingState.Recording && recordingRef.current) {
			const recording = recordingRef.current;
			recordingRef.current = null;
			setRecordingState(RecordingState.NotStarted);
			await recording.stopAndUnloadAsync();

			await Audio.setAudioModeAsync({
				allowsRecordingIOS: false,
			});

			let uri = recording.getURI();
			let type: string|undefined;
			let fileName;
			if (Platform.OS === 'web') {
				// On web, we need to fetch the result (which is a blob URL) and save it in our
				// virtual file system so that it can be processed elsewhere.
				const fetchResult = await fetch(uri);
				const blob = await fetchResult.blob();

				// expo-av records to webm format on web
				fileName = `recording-${uuid.create()}.webm`;
				const file = new File([blob], fileName);
				type = 'audio/webm';

				const path = `/tmp/${fileName}`;
				await (shim.fsDriver() as FsDriverWeb).createReadOnlyVirtualFile(path, file);
				uri = path;
			} else {
				const extension = Platform.select({
					android: recordingOptions.android.extension,
					ios: recordingOptions.ios.extension,
					default: '',
				});
				fileName = `recording${extension}`;
			}

			props.onFileSaved({
				uri,
				type,
				fileName,
			});
			props.onDismiss();
		}
	}, [recordingState, permissionResponse, requestPermission, props.onFileSaved, props.onDismiss]);

	useEffect(() => () => {
		if (recordingRef.current) {
			void recordingRef.current?.stopAndUnloadAsync();
			recordingRef.current = null;
		}
	}, []);

	return <>
		<PrimaryButton onPress={onStartStopRecording}>{
			recordingState === RecordingState.NotStarted ? _('Start') : _('Done')
		}</PrimaryButton>
		<PrimaryButton onPress={props.onDismiss}>{_('Cancel')}</PrimaryButton>
	</>;
};

export default AudioRecording;
