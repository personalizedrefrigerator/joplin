import * as React from 'react';
import { currentLocale } from '@joplin/lib/locale';
import { ResourceEntity } from '@joplin/lib/services/database/types';
import AudioRecordingBanner from '../../voiceTyping/AudioRecordingBanner';
import SpeechToTextBanner from '../../voiceTyping/SpeechToTextBanner';
import { PickerResponse } from './types';

interface Props {
	showAudioRecorder: boolean;
	showSpeechToTextDialog: boolean;
	onAudioFileSaved: (file: PickerResponse)=> Promise<ResourceEntity|null>;
	onAudioDismiss: ()=> void;
	onSpeechText: (text: string)=> void;
	onSpeechDismiss: ()=> void;
}

const VoiceTypingDialogs: React.FC<Props> = props => {
	return <>
		{props.showAudioRecorder && <AudioRecordingBanner
			onFileSaved={props.onAudioFileSaved}
			onDismiss={props.onAudioDismiss}
		/>}
		{props.showSpeechToTextDialog && <SpeechToTextBanner
			locale={currentLocale()}
			onText={props.onSpeechText}
			onDismiss={props.onSpeechDismiss}
		/>}
	</>;
};

export default VoiceTypingDialogs;
