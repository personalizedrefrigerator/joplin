import * as React from 'react';
import ScreenHeader from '../ScreenHeader';
import NoteBodyViewer from '../NoteBodyViewer/NoteBodyViewer';
import { MarkupLanguage } from '@joplin/renderer';
import { Text } from 'react-native-paper';
import { _, currentLocale } from '@joplin/lib/locale';
import { ResourceInfos } from '@joplin/renderer/types';
import { useMemo, useState } from 'react';
import useAsyncEffect from '@joplin/lib/hooks/useAsyncEffect';
import attachedResources from '@joplin/lib/utils/attachedResources';
import { themeStyle } from '../global-style';
import { ScrollView, StyleSheet, View } from 'react-native';
import { connect } from 'react-redux';
import { AppState } from '../../utils/types';
import useQueuedAsyncEffect from '@joplin/lib/hooks/useQueuedAsyncEffect';
import whisper from '../../services/voiceTyping/whisper';
import Resource from '@joplin/lib/models/Resource';
import VoiceTyping from '../../services/voiceTyping/VoiceTyping';

interface AudioNavigation {
	state: {
		resourceId?: string;
	};
}

interface Props {
	themeId: number;
	navigation: AudioNavigation;
}

const emptyArray: [] = [];
const emptyFunction = ()=>{};

const useStyles = (themeId: number) => {
	return useMemo(() => {
		const theme = themeStyle(themeId);
		return StyleSheet.create({
			rootStyle: theme.rootStyle,
			viewer: {
				height: 300,
			},
			scrollView: {
				flexGrow: 1,
			},
		});
	}, [themeId]);
};

const useResourceData = (resourceId: string|undefined) => {
	const [resourceInfos, setResourceInfos] = useState<ResourceInfos>({});
	const previewBody = `[audio recording](:/${resourceId})`;

	useAsyncEffect(async (event) => {
		const infos = await attachedResources(previewBody);
		if (!event.cancelled) {
			setResourceInfos(infos);
		}
	}, [previewBody]);

	return {
		resourceInfos,
		previewBody,
	};
};

const AudioTranscription: React.FC<Props> = props => {
	const resourceId = props.navigation.state.resourceId;
	const { resourceInfos, previewBody } = useResourceData(resourceId);
	const [transcription, setTranscription] = useState('...');
	const styles = useStyles(props.themeId);

	useQueuedAsyncEffect(async () => {
		if (!resourceId) return;

		const resource = await Resource.load(resourceId);
		const resourceFile = Resource.fullPath(resource, false);

		const voiceTyping = new VoiceTyping(currentLocale(), [whisper]);
		const session = await voiceTyping.build({
			onPreview: (text) => {
				console.log('PREVIEW', text);
				setTranscription(transcription => `${transcription}\n${text}`);
			},
			onFinalize: (text) => {
				console.log('FINAL', text);
				setTranscription(text);
			},
		}, resourceFile);
		await session.start();
	}, [resourceId]);

	return <View style={styles.rootStyle}>
		<ScreenHeader title={_('Audio transcription')}/>
		<ScrollView>
			<Text
				variant='titleMedium'
				accessibilityRole='header'
			>{_('Audio')}</Text>
			<NoteBodyViewer
				style={styles.viewer}
				noteBody={previewBody}
				noteMarkupLanguage={MarkupLanguage.Markdown}
				highlightedKeywords={emptyArray}
				paddingBottom={10}
				initialScroll={0}
				noteHash=''
				onJoplinLinkClick={emptyFunction}
				onScroll={emptyFunction}
				noteResources={resourceInfos}
			/>
			<Text
				variant='titleSmall'
				accessibilityRole='header'
			>{_('Transcript')}</Text>
			<Text variant='bodyMedium'>
				{transcription}
			</Text>
		</ScrollView>
	</View>;
};

export default connect((state: AppState) => ({
	themeId: state.settings.theme,
}))(AudioTranscription);
