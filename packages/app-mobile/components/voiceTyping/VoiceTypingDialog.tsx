import * as React from 'react';
import { useState } from 'react';
import { Surface, SegmentedButtons } from 'react-native-paper';
import { _ } from '@joplin/lib/locale';
import { AppState } from '../../utils/types';
import { connect } from 'react-redux';
import { View, StyleSheet } from 'react-native';
import SpeechToText from './SpeechToText';
import { OnFileSavedCallback } from './types';
import AudioRecording from './AudioRecording';

interface Props {
	locale: string;
	provider: string;
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

enum VoiceTypingMode {
	AudioRecording = 'record',
	SpeechToText = 'speech-to-text',
}

const VoiceTypingDialog: React.FC<Props> = props => {
	const [voiceTypingMode, setVoiceTypingMode] = useState<VoiceTypingMode>(null);
	let content;
	if (voiceTypingMode === VoiceTypingMode.SpeechToText) {
		content = <SpeechToText
			locale={props.locale}
			onText={props.onText}
			onDismiss={props.onDismiss}
		/>;
	} else if (voiceTypingMode === VoiceTypingMode.AudioRecording) {
		content = <AudioRecording
			onFileSaved={props.onFile}
			onDismiss={props.onDismiss}
		/>;
	}

	return <Surface>
		<View style={styles.container}>
			{content}
			<SegmentedButtons
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
			/>
		</View>
	</Surface>;
};

export default connect((state: AppState) => ({
	provider: state.settings['voiceTyping.preferredProvider'],
}))(VoiceTypingDialog);
