import * as React from 'react';
import ScreenHeader from '../ScreenHeader';
import NoteBodyViewer from '../NoteBodyViewer/NoteBodyViewer';
import { MarkupLanguage } from '@joplin/renderer';
import { Text } from 'react-native-paper';
import { _ } from '@joplin/lib/locale';
import { ResourceInfos } from '@joplin/renderer/types';
import { useMemo, useState } from 'react';
import useAsyncEffect from '@joplin/lib/hooks/useAsyncEffect';
import attachedResources from '@joplin/lib/utils/attachedResources';
import { themeStyle } from '../global-style';
import { ScrollView, StyleSheet, View } from 'react-native';
import { connect } from 'react-redux';
import { AppState } from '../../utils/types';

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
	const { resourceInfos, previewBody } = useResourceData(
		props.navigation.state.resourceId,
	);
	const [transcription] = useState('');
	const styles = useStyles(props.themeId);

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
