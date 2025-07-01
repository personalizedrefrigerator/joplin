import * as React from 'react';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { themeStyle } from '../../global-style';
import { ScrollView, StyleSheet, View } from 'react-native';
import { CameraResult } from '../../CameraView/types';
import TextInput from '../../TextInput';
import PhotoPreview from '../../CameraView/PhotoPreview';
import TagEditor, { TagEditorMode } from '../../TagEditor';
import { AppState } from '../../../utils/types';
import { connect } from 'react-redux';
import { FolderEntity, TagEntity } from '@joplin/lib/services/database/types';
import { Button } from 'react-native-paper';
import { _ } from '@joplin/lib/locale';
import FolderPicker from '../../FolderPicker';
import Folder from '@joplin/lib/models/Folder';
import Setting from '@joplin/lib/models/Setting';
import { formatMsToLocal } from '@joplin/utils/time';

export interface CreateNoteEvent {
	sourceImage: CameraResult;
	title: string;
	tags: string[];
	parentId: string;
}

interface Props {
	themeId: number;
	photoIndex: number;
	sourceImage: CameraResult;
	allTags: TagEntity[];
	allFolders: FolderEntity[];

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
			folderPickerLine: {
				flexDirection: 'row',
				justifyContent: 'space-between',
				gap: theme.margin,
				margin: theme.margin,
			},
			folderPicker: {
				flexGrow: 1,
			},
		});
	}, [themeId]);
};

const tagSearchResultsProps = {
	// Required on Android when including one <ScrollView> inside another:
	nestedScrollEnabled: true,
};

const NotePreview: React.FC<Props> = ({
	themeId, sourceImage, photoIndex, allTags, onCreateNote, allFolders,
}) => {
	const styles = useStyles(themeId);
	const [title, setTitle] = useState('');
	const [tags, setTags] = useState([]);
	const [selectedFolderId, setSelectedFolderId] = useState('');

	useEffect(() => {
		const template = Setting.value('scanner.titleTemplate');
		const date = formatMsToLocal(Date.now(), Setting.value('dateFormat'));
		setTitle(
			template.replace(/{date}/g, date)
				.replace(/{page}/g, `${photoIndex + 1}`),
		);
	}, [photoIndex]);

	const onNewNote = useCallback(() => {
		onCreateNote({
			tags,
			title,
			sourceImage,
			parentId: selectedFolderId ?? '',
		});
	}, [onCreateNote, tags, title, sourceImage, selectedFolderId]);

	const onNewFolder = useCallback(async (title: string) => {
		const folder = await Folder.save({ title });
		setSelectedFolderId(folder.id);
	}, []);

	return <ScrollView style={styles.rootScrollView}>
		<TextInput
			style={styles.titleInput}
			themeId={themeId}
			value={title}
			onChangeText={setTitle}
		/>
		<View style={styles.folderPickerLine}>
			<PhotoPreview
				source={sourceImage}
				backgroundStyle={styles.photoBackground}
				textStyle={styles.photoLabel}
				label={photoIndex}
			/>
			<FolderPicker
				themeId={themeId}
				darkText
				placeholder={_('Select notebook')}
				folders={allFolders}
				onValueChange={setSelectedFolderId}
				selectedFolderId={selectedFolderId}
				mustSelect={true}
				onNewFolder={onNewFolder}
			/>
		</View>
		<TagEditor
			themeId={themeId}
			tags={tags}
			mode={TagEditorMode.Compact}
			allTags={allTags}
			style={styles.tagEditor}
			onTagsChange={setTags}
			searchResultProps={tagSearchResultsProps}
		/>
		<Button onPress={onNewNote}>{_('Create note')}</Button>
	</ScrollView>;
};

export default connect((state: AppState) => ({
	allTags: state.tags,
	allFolders: state.folders,
	themeId: state.settings.theme,
}))(NotePreview);
