import * as React from 'react';
import { CameraResult } from './types';
import { View, StyleSheet } from 'react-native';
import CameraView from './CameraView';
import { useCallback, useMemo, useState } from 'react';
import { themeStyle } from '../global-style';
import { Button } from 'react-native-paper';
import { _ } from '@joplin/lib/locale';
import PhotoPreview from './PhotoPreview';

export type OnComplete = (photos: CameraResult[])=> void;

interface Props {
	themeId: number;
	onCancel: ()=> void;
	onComplete: OnComplete;
	onInsertBarcode: (barcodeText: string)=> void;
}

const useStyle = (themeId: number) => {
	return useMemo(() => {
		const theme = themeStyle(themeId);
		return StyleSheet.create({
			camera: {
				flex: 1,
			},
			root: {
				flex: 1,
				backgroundColor: theme.backgroundColor,
			},
			bottomRow: {
				flexDirection: 'row',
				alignItems: 'center',
			},
			photoWrapper: {
				flexGrow: 1,
				minHeight: 82,
				flexDirection: 'row',
				justifyContent: 'center',
			},

			imagePreview: {
				maxWidth: 70,
			},
			imageCountText: {
				backgroundColor: theme.backgroundColor2,
				color: theme.color2,
			},
		});
	}, [themeId]);
};


const CameraViewMultiPage: React.FC<Props> = ({
	onInsertBarcode, onCancel, onComplete, themeId,
}) => {
	const [photos, setPhotos] = useState<CameraResult[]>([]);
	const onPhoto = useCallback((data: CameraResult) => {
		setPhotos(photos => [...photos, data]);
	}, []);

	const onDonePressed = useCallback(() => {
		onComplete(photos);
	}, [photos, onComplete]);

	const styles = useStyle(themeId);
	const renderLastPhoto = () => {
		if (!photos.length) return null;

		return <PhotoPreview
			label={photos.length}
			source={photos[photos.length - 1]}
			backgroundStyle={styles.imagePreview}
			textStyle={styles.imageCountText}
		/>;
	};

	return <View style={styles.root}>
		<CameraView
			onCancel={null}
			onInsertBarcode={onInsertBarcode}
			style={styles.camera}
			onPhoto={onPhoto}
		/>
		<View style={styles.bottomRow}>
			<Button icon='arrow-left' onPress={onCancel}>{_('Back')}</Button>
			<View style={styles.photoWrapper}>
				{renderLastPhoto()}
			</View>
			<Button
				icon='arrow-right'
				disabled={photos.length === 0}
				onPress={onDonePressed}
			>{_('Next')}</Button>
		</View>
	</View>;
};

export default CameraViewMultiPage;
