import * as React from 'react';
import { useMemo, useState, useCallback } from 'react';
import { themeStyle } from '../../global-style';
import { ScrollView, StyleSheet, View } from 'react-native';
import { CameraResult } from '../../CameraView/types';
import TextInput from '../../TextInput';
import PhotoPreview from '../../CameraView/PhotoPreview';
import TagEditor from '../../TagEditor';
import { AppState } from '../../../utils/types';
import { connect } from 'react-redux';
import { TagEntity } from '@joplin/lib/services/database/types';
import { Button } from 'react-native-paper';
import { _ } from '@joplin/lib/locale';

interface CreateNoteEvent {
	sourceImage: CameraResult;
	title: string;
	tags: string[];
}

interface Props {
	themeId: number;
	photoIndex: number;
	titleTemplate: string;
	sourceImage: CameraResult;
	allTags: TagEntity[];

	onCreateNote: (event: CreateNoteEvent)=> void;
}

const useStyles = (themeId: number) => {
	return useMemo(() => {
		const theme = themeStyle(themeId);
		return StyleSheet.create({
			titleInput: {
				color: theme.color,
				fontSize: theme.fontSize,
			},
			rootScrollView: {
				flex: 1,
			},
			photoBackground: {

			},
			photoLabel: {

			},
			tagEditor: {},
		});
	}, [themeId]);
};

const NotePreview: React.FC<Props> = ({ themeId, sourceImage, photoIndex, allTags, onCreateNote }) => {
	const styles = useStyles(themeId);
	const [title, setTitle] = useState('...');
	const [tags, setTags] = useState([]);

	const onNewNote = useCallback(() => {
		onCreateNote({
			tags,
			title,
			sourceImage,
		});
	}, [onCreateNote, tags, title, sourceImage]);

	return <ScrollView style={styles.rootScrollView}>
		<TextInput
			style={styles.titleInput}
			themeId={themeId}
			value={title}
			onChangeText={setTitle}
		/>
		<View>
			<PhotoPreview
				source={sourceImage}
				backgroundStyle={styles.photoBackground}
				textStyle={styles.photoLabel}
				label={photoIndex}
			/>
		</View>
		<TagEditor
			themeId={themeId}
			tags={tags}
			allTags={allTags}
			style={styles.tagEditor}
			onTagsChange={setTags}
			nestedScrollingEnabled={true}
		/>
		<Button onPress={onNewNote}>{_('Create note')}</Button>
	</ScrollView>;
};

export default connect((state: AppState) => ({
	allTags: state.tags,
}))(NotePreview);
