import * as React from 'react';
import { useEffect, useState } from 'react';
import { Surface, SegmentedButtons } from 'react-native-paper';
import { _ } from '@joplin/lib/locale';
import { AppState } from '../../utils/types';
import { connect } from 'react-redux';
import { View, StyleSheet, Platform } from 'react-native';
import SpeechToText from './SpeechToText';
import { OnFileSavedCallback } from './types';
import AudioRecording from './AudioRecording';
import Setting from '@joplin/lib/models/Setting';

enum VoiceTypingMode {
	AudioRecording = 'record',
	SpeechToText = 'speech-to-text',
}

interface Props {
	locale: string;
	provider: string;
	defaultVoiceTypingMode: VoiceTypingMode;
	onDismiss: ()=> void;
	onText: (text: string)=> void;
	onFile: OnFileSavedCallback;
}

const styles = StyleSheet.create({
	container: {
		marginHorizontal: 1,
		width: '100%',
		maxWidth: 680,
		alignSelf: 'center',
	},
});

const supportsSpeechToText = Platform.OS === 'android';

const VoiceTypingDialog: React.FC<Props> = props => {
	const [voiceTypingMode, setVoiceTypingMode] = useState<VoiceTypingMode>(props.defaultVoiceTypingMode);

	useEffect(() => {
		if (voiceTypingMode !== props.defaultVoiceTypingMode) {
			Setting.setValue('voiceTyping.mode', voiceTypingMode);
		}
	}, [voiceTypingMode, props.defaultVoiceTypingMode]);

	let content;
	if (voiceTypingMode === VoiceTypingMode.AudioRecording || !supportsSpeechToText) {
		content = <AudioRecording
			onFileSaved={props.onFile}
			onDismiss={props.onDismiss}
		/>;
	} else if (voiceTypingMode === VoiceTypingMode.SpeechToText) {
		content = <SpeechToText
			locale={props.locale}
			onText={props.onText}
			onDismiss={props.onDismiss}
		/>;
	}

	const modeSelector = <SegmentedButtons
		value={voiceTypingMode}
		onValueChange={(value: string) => setVoiceTypingMode(value as VoiceTypingMode)}
		buttons={[
			{
				value: VoiceTypingMode.AudioRecording,
				label: _('Voice recording'),
			},
			{
				value: VoiceTypingMode.SpeechToText,
				label: _('Speech to text'),
			},
		]}
	/>;

	return <Surface>
		<View style={styles.container}>
			{content}
			{supportsSpeechToText ? modeSelector : null}
		</View>
	</Surface>;
};

export default connect((state: AppState) => {
	let defaultVoiceTypingMode = supportsSpeechToText ? VoiceTypingMode.SpeechToText : VoiceTypingMode.AudioRecording;
	if (state.settings['voiceTyping.mode'] === VoiceTypingMode.SpeechToText) {
		defaultVoiceTypingMode = VoiceTypingMode.SpeechToText;
	} else if (state.settings['voiceTyping.mode'] === VoiceTypingMode.AudioRecording) {
		defaultVoiceTypingMode = VoiceTypingMode.AudioRecording;
	}

	return {
		provider: state.settings['voiceTyping.preferredProvider'],
		defaultVoiceTypingMode,
	};
})(VoiceTypingDialog);
