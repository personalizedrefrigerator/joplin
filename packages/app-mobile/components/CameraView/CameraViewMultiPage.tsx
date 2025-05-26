import * as React from 'react';
import { CameraResult } from './types';
import { View, StyleSheet, ScrollView, Platform, ImageBackground, ViewStyle, TextStyle } from 'react-native';
import CameraView from './CameraView';
import { useCallback, useMemo, useState } from 'react';
import { themeStyle } from '../global-style';
import { Button, Text } from 'react-native-paper';
import { _ } from '@joplin/lib/locale';
import useAsyncEffect from '@joplin/lib/hooks/useAsyncEffect';
import shim from '@joplin/lib/shim';

interface Props {
	themeId: number;
	onCancel: ()=> void;
	onComplete: (photos: CameraResult[])=> void;
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
			},
			previousPhotos: {
				flexDirection: 'row',
			},
			previousPhotosContent: {
				marginLeft: 'auto',
				marginRight: 'auto',
			},

			imagePreview: {
				minWidth: 40,
				alignContent: 'center',
				justifyContent: 'center',
			},
			imageText: {
				marginLeft: 'auto',
				marginRight: 'auto',
				padding: 2,
				borderRadius: 4,
				backgroundColor: theme.backgroundColor2,
				color: theme.color2,
			},
		});
	}, [themeId]);
};

interface PhotoProps {
	source: CameraResult;
	backgroundStyle: ViewStyle;
	textStyle: TextStyle;
	index: number;
}

const PhotoPreview: React.FC<PhotoProps> = ({ source, index, backgroundStyle, textStyle }) => {
	const [uri, setUri] = useState('');

	useAsyncEffect(async (event) => {
		if (Platform.OS === 'web') {
			const file = await shim.fsDriver().fileAtPath(source.uri);
			if (event.cancelled) return;

			const uri = URL.createObjectURL(file);
			setUri(uri);

			event.onCleanup(() => {
				URL.revokeObjectURL(uri);
			});
		} else {
			setUri(source.uri);
		}
	}, [source]);
	return <ImageBackground
		style={backgroundStyle}
		resizeMode='contain'
		source={{ uri }}
		accessibilityLabel={_('Photo preview: %d', index + 1)}
	>
		<Text style={textStyle}>{index + 1}</Text>
	</ImageBackground>;
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
	const renderPhotos = () => {
		return photos.map((photo, index) => {
			return <PhotoPreview
				index={index}
				source={photo}
				backgroundStyle={styles.imagePreview}
				textStyle={styles.imageText}
				key={`photo-${index}`}
			/>;
		});
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
			<ScrollView
				style={styles.previousPhotos}
				contentContainerStyle={styles.previousPhotosContent}
				horizontal={true}
			>
				{renderPhotos()}
			</ScrollView>
			<Button icon='arrow-right' onPress={onDonePressed}>{_('Next')}</Button>
		</View>
	</View>;
};

export default CameraViewMultiPage;
