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
import { Portal, Snackbar, Text } from 'react-native-paper';
import useBackHandler from '../../../utils/hooks/useBackHandler';
import { PrimaryButton } from '../../buttons';

interface Props {
	dispatch: Dispatch;
	themeId: number;
}

const useStyles = (themeId: number) => {
	return useMemo(() => {
		const theme = themeStyle(themeId);
		return StyleSheet.create({
			root: theme.rootStyle,
			noRemainingPhotosContainer: {
				margin: theme.margin,
				gap: theme.margin,
			},
		});
	}, [themeId]);
};

const DocumentScanner: React.FC<Props> = ({ themeId, dispatch }) => {
	const styles = useStyles(themeId);
	const [cameraVisible, setCameraVisible] = useState(true);
	const [photos, setPhotos] = useState<CameraResult[]>([]);
	const [snackbarMessage, setSnackbarMessage] = useState('');

	useBackHandler(() => {
		if (photos.length && !cameraVisible) {
			setCameraVisible(true);
			return true;
		}
		return false;
	});

	const onDeleteLastPhoto = useCallback(() => {
		setSnackbarMessage('');
		setPhotos(photos => {
			const result = [...photos];
			result.pop();
			return result;
		});
	}, []);

	const onCloseScreen = useCallback(() => {
		setPhotos([]);
		dispatch({ type: 'NAV_BACK' });
	}, [dispatch]);

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

	const onHideCamera = useCallback(() => {
		setCameraVisible(false);
	}, []);

	const renderContent = () => {
		if (cameraVisible) {
			return <CameraViewMultiPage
				themeId={themeId}
				onCancel={onCloseScreen}
				onComplete={onHideCamera}
				photos={photos}
				onSetPhotos={setPhotos}
				onInsertBarcode={()=>{}}
			/>;
		} else if (photos.length > 0) {
			return <>
				<ScreenHeader title={_('Note preview')} onDeleteButtonPress={onDeleteLastPhoto}/>
				<NotePreview
					photoIndex={photos.length}
					sourceImage={photos[photos.length - 1]}
					onCreateNote={onCreateNote}
				/>
			</>;
		} else {
			return <>
				<ScreenHeader title={_('Document scanner')}/>
				<View style={styles.noRemainingPhotosContainer}>
					<Text>{_('No photos remaining.')}</Text>
					<PrimaryButton onPress={onCloseScreen}>{_('Done')}</PrimaryButton>
				</View>
			</>;
		}
	};

	return <View style={styles.root}>
		{renderContent()}
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
	</View>;
};

export default connect((state: AppState) => ({
	themeId: state.settings.theme,
}))(DocumentScanner);
