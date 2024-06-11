import * as React from 'react';
import { NoteScreenControl, VisibleOverlay } from './types';
import { useCallback } from 'react';
import CameraView from '../../CameraView';

interface Props {
	themeId: number;
	noteControl: NoteScreenControl;
}

const CameraOverlay: React.FC<Props> = props => {
	type OnPhotoEventSlice = { uri: string };
	const onPhoto = useCallback(({ uri }: OnPhotoEventSlice) => {
		void props.noteControl.attachFile(
			{
				uri,
				type: 'image/jpg',
			},
			'image',
		);

		props.noteControl.setVisibleOverlay(VisibleOverlay.None);
	}, [props.noteControl]);

	const onCancel = useCallback(() => {
		props.noteControl.setVisibleOverlay(VisibleOverlay.None);
	}, [props.noteControl]);

	return <CameraView themeId={props.themeId} style={{ flex: 1 }} onPhoto={onPhoto} onCancel={onCancel} />;
};

export default CameraOverlay;

