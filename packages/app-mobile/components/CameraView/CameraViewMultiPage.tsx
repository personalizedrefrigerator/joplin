import * as React from 'react';
import { CameraResult } from './types';
import { View, StyleSheet, Platform, ImageBackground, ViewStyle, TextStyle } from 'react-native';
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
				alignItems: 'center',
				height: 82,
			},
			photoWrapper: {
				flexGrow: 1,
				flexDirection: 'row',
				justifyContent: 'center',
			},

			imagePreview: {
				flexBasis: 150,
				flexShrink: 1,
				flexGrow: 1,
				alignContent: 'center',
				justifyContent: 'center',
			},
			imageCountText: {
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
	label: number;
}

const PhotoPreview: React.FC<PhotoProps> = ({ source, label, backgroundStyle, textStyle }) => {
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
		accessibilityLabel={_('%d photo(s) taken', label)}
	>
		<Text style={textStyle}>{label}</Text>
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
