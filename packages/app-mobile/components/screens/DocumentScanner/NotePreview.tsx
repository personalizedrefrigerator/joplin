import * as React from 'react';
import { useMemo, useState } from 'react';
import { themeStyle } from '../../global-style';
import { StyleSheet, View } from 'react-native';
import { CameraResult } from '../../CameraView/types';
import TextInput from '../../TextInput';
import PhotoPreview from '../../CameraView/PhotoPreview';
import TagEditor from '../../TagEditor';
import { AppState } from '../../../utils/types';
import { connect } from 'react-redux';
import { TagEntity } from '@joplin/lib/services/database/types';

interface Props {
	themeId: number;
	photoIndex: number;
	titleTemplate: string;
	sourceImage: CameraResult;

	allTags: TagEntity[];
}

const useStyles = (themeId: number) => {
	return useMemo(() => {
		const theme = themeStyle(themeId);
		return StyleSheet.create({
			titleInput: {
				color: theme.color,
				fontSize: theme.fontSize,
			},
			photoBackground: {

			},
			photoLabel: {

			},
			tagEditor: {},
		});
	}, [themeId]);
};

const NotePreview: React.FC<Props> = ({ themeId, sourceImage, photoIndex, allTags }) => {
	const styles = useStyles(themeId);
	const [title, setTitle] = useState('...');
	const [tags, setTags] = useState([]);

	return <>
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
		/>
	</>;
};

export default connect((state: AppState) => ({
	allTags: state.tags,
}))(NotePreview);
