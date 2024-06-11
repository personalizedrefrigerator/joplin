import * as React from 'react';
import { NoteScreenControl, VisibleOverlay } from './types';
import { useCallback, useState } from 'react';
import ImageEditor from '../../NoteEditor/ImageEditor/ImageEditor';

interface Props {
	themeId: number;
	noteControl: NoteScreenControl;
}

const ImageEditorOverlay: React.FC<Props> = props => {
	type OnPhotoEventSlice = { uri: string };
	const onSave = useCallback((svgData: string) => {
		void props.noteControl.attachFile(
			{
				uri,
				type: 'image/jpg',
			},
			'image',
		);

		props.noteControl.setVisibleOverlay(VisibleOverlay.None);
	}, [props.noteControl]);

	const onClose = useCallback(() => {
		props.noteControl.setVisibleOverlay(VisibleOverlay.None);
	}, [props.noteControl]);

	const [ imageEditorResourceFilepath, setImageEditorResourceFilepath ] = useState<string|null>(null);

	return <ImageEditor
		resourceFilename={imageEditorResourceFilepath}
		themeId={props.themeId}
		onSave={onSave}
		onExit={onClose}
	/>;
};

export default ImageEditorOverlay;

