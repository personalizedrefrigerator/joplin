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
import NotePreview from './NotePreview';

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

	const onCloseScreen = useCallback(() => {
		dispatch({ type: 'NAV_BACK' });
	}, [dispatch]);

	const onDeleteLastPhoto = useCallback(() => {
		setPhotos(photos => {
			const result = [...photos];
			result.pop();
			return result;
		});
	}, []);

	const onCreateNote = useCallback(() => {
		// TODO: Show toast message?
		// TODO: Remove last photo
		onDeleteLastPhoto();
		// TODO: Hide the scanner if out of photos
	}, [onDeleteLastPhoto]);

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
			themeId={themeId}
			photoIndex={photos.length}
			titleTemplate={'photo-test'}
			sourceImage={photos[photos.length - 1]}
			onCreateNote={onCreateNote}
		/>
	</>;

	return <View style={styles.root}>
		{content}
	</View>;
};

export default connect((state: AppState) => ({
	theme: state.settings.theme,
}))(DocumentScanner);
