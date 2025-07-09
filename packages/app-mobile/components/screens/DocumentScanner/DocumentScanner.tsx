import * as React from 'react';
import { StyleSheet, View } from 'react-native';
import { connect } from 'react-redux';
import { AppState } from '../../../utils/types';
import { useCallback, useMemo, useState } from 'react';
import { themeStyle } from '../../global-style';
import CameraViewMultiPage from '../../CameraView/CameraViewMultiPage';
import { Dispatch } from 'redux';
import ScreenHeader from '../../ScreenHeader';
import { _ } from '@joplin/lib/locale';
import { CameraResult } from '../../CameraView/types';
import NotePreview, { CreateNoteEvent } from './NotePreview';
import shim from '@joplin/lib/shim';
import Note from '@joplin/lib/models/Note';
import Tag from '@joplin/lib/models/Tag';
import { Portal, Snackbar } from 'react-native-paper';

interface Props {
	dispatch: Dispatch;
	themeId: number;
}

const useStyles = (themeId: number) => {
	return useMemo(() => {
		const theme = themeStyle(themeId);
		return StyleSheet.create({
			root: theme.rootStyle,
			titleInput: {},
		});
	}, [themeId]);
};

const DocumentScanner: React.FC<Props> = ({ themeId, dispatch }) => {
	const styles = useStyles(themeId);
	const [photos, setPhotos] = useState<CameraResult[]>([]);
	const [snackbarMessage, setSnackbarMessage] = useState('');

	const onCloseScreen = useCallback(() => {
		dispatch({ type: 'NAV_BACK' });
	}, [dispatch]);

	const onDeleteLastPhoto = useCallback(() => {
		setSnackbarMessage('');
		setPhotos(photos => {
			const result = [...photos];
			result.pop();
			return result;
		});
	}, []);

	const onCreateNote = useCallback(async (event: CreateNoteEvent) => {
		onDeleteLastPhoto();

		const resource = await shim.createResourceFromPath(
			event.sourceImage.uri,
			{ title: event.title, mime: event.sourceImage.type },
		);
		const note = await Note.save({
			title: event.title,
			body: `![${event.title}](:/${resource.id})`,
			parent_id: event.parentId,
		});
		await Tag.setNoteTagsByTitles(note.id, event.tags);

		setSnackbarMessage(_('Created note: "%s"', note.title));
	}, [onDeleteLastPhoto]);

	const onDismissSnackbar = useCallback(() => {
		setSnackbarMessage('');
	}, []);

	const content = photos.length === 0 ? (
		<CameraViewMultiPage
			themeId={themeId}
			onCancel={onCloseScreen}
			onComplete={setPhotos}
			onInsertBarcode={()=>{}}
		/>
	) : <>
		<ScreenHeader title={_('Note preview')} onDeleteButtonPress={onDeleteLastPhoto}/>
		<NotePreview
			key={`note-preview-${photos.length}`}
			photoIndex={photos.length}
			sourceImage={photos[photos.length - 1]}
			onCreateNote={onCreateNote}
		/>
		<Portal>
			<Snackbar
				key={`snackbar--${snackbarMessage}`}
				visible={!!snackbarMessage}
				onDismiss={onDismissSnackbar}
				action={{
					label: _('Dismiss'),
					onPress: onDismissSnackbar,
				}}
			>{snackbarMessage}</Snackbar>
		</Portal>
	</>;

	return <View style={styles.root}>
		{content}
	</View>;
};

export default connect((state: AppState) => ({
	themeId: state.settings.theme,
}))(DocumentScanner);
