import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { connect } from 'react-redux';
import { Text, StyleSheet, Linking, View, useWindowDimensions } from 'react-native';
import { _ } from '@joplin/lib/locale';
import { ViewStyle } from 'react-native';
import { useCameraPermission, useCameraDevice, Camera, CameraProps, CameraDeviceFormat, Orientation } from 'react-native-vision-camera';
import useAsyncEffect from '@joplin/lib/hooks/useAsyncEffect';
import { AppState } from '../../utils/types';
import ActionButtons from './ActionButtons';
import { CameraDirection } from '@joplin/lib/models/settings/builtInMetadata';
import Setting from '@joplin/lib/models/Setting';
import { LinkButton, PrimaryButton } from '../buttons';
import BackButtonService from '../../services/BackButtonService';
import { themeStyle } from '../global-style';
import fitRectIntoBounds from './utils/fitRectIntoBounds';
import useBestFormat from './utils/useBestFormat';
import useAvailableRatios from './utils/useAvailableRatios';
import pixelRectToAspectRatio from './utils/pixelRectToAspectRatio';

// Work around a type mismatch that seems related to a different version of @types/react in
// react-native-vision-camera:
const CameraComponent = Camera as unknown as React.FC<CameraProps & { ref: unknown }>;

interface CameraData {
	uri: string;
}

interface Props {
	themeId: number;
	style: ViewStyle;
	cameraType: CameraDirection;
	cameraRatio: string;
	onPhoto: (data: CameraData)=> void;
	onCancel: ()=> void;
}

interface UseStyleProps {
	themeId: number;
	style: ViewStyle;
	cameraFormat: CameraDeviceFormat|null;
	sensorOrientation: Orientation|null;
}

const useStyles = ({ themeId, style, cameraFormat, sensorOrientation }: UseStyleProps) => {
	const { width: screenWidth, height: screenHeight } = useWindowDimensions();
	const outputPositioning = useMemo((): ViewStyle => {
		if (!sensorOrientation) return {};

		const reverseWidthHeight = sensorOrientation.includes('landscape');
		const output = fitRectIntoBounds({
			width: !reverseWidthHeight ? cameraFormat.photoWidth : cameraFormat.photoHeight,
			height: reverseWidthHeight ? cameraFormat.photoWidth : cameraFormat.photoHeight,
		}, {
			width: screenWidth,
			height: screenHeight,
		});

		const result: ViewStyle = {
			transform: [
				{ translateX: (screenWidth - output.width) / 2 },
				{ translateY: (screenHeight - output.height) / 2 },
			],
			width: output.width,
			height: output.height,
		};
		return result;
	}, [cameraFormat, sensorOrientation, screenWidth, screenHeight]);

	return useMemo(() => {
		const theme = themeStyle(themeId);
		return StyleSheet.create({
			container: {
				backgroundColor: '#000',
				...style,
			},
			camera: {
				position: 'relative',
				...outputPositioning,
				...style,
			},
			loadingContainer: {
				backgroundColor: theme.backgroundColor,
				maxWidth: 600,
				marginLeft: 'auto',
				marginRight: 'auto',
				padding: 28,
				borderRadius: 28,
			},
		});
	}, [themeId, style, outputPositioning]);
};

const onDeviceSettingsClick = () => Linking.openSettings();

const CameraViewComponent: React.FC<Props> = props => {
	const cameraRef = useRef<Camera|null>(null);
	const { hasPermission, requestPermission } = useCameraPermission();
	const [requestingPermissions, setRequestingPermissions] = useState(false);
	const [cameraReady, setCameraReady] = useState(false);

	const deviceFront = useCameraDevice('front');
	const deviceBack = useCameraDevice('back');
	const preferredDevice = props.cameraType === CameraDirection.Front ? deviceFront : deviceBack;
	const device = preferredDevice ?? deviceFront ?? deviceBack;

	const format = useBestFormat(device?.formats ?? [], props.cameraRatio);
	const styles = useStyles({
		themeId: props.themeId,
		cameraFormat: format,
		style: props.style,
		sensorOrientation: device?.sensorOrientation,
	});

	useAsyncEffect(async () => {
		try {
			if (!hasPermission) {
				setRequestingPermissions(true);
				await requestPermission();
			}
		} finally {
			setRequestingPermissions(false);
		}
	}, [hasPermission, requestPermission]);

	useEffect(() => {
		const handler = () => {
			props.onCancel();
			return true;
		};
		BackButtonService.addHandler(handler);
		return () => {
			BackButtonService.removeHandler(handler);
		};
	}, [props.onCancel]);

	const onCameraReverse = useCallback(() => {
		const newDirection = props.cameraType === CameraDirection.Front ? CameraDirection.Back : CameraDirection.Front;
		Setting.setValue('camera.type', newDirection);
	}, [props.cameraType]);

	const availableRatios = useAvailableRatios(device?.formats ?? []);
	const onNextCameraRatio = useCallback(async () => {
		const integerRatios = availableRatios.filter(ratio => !ratio.match(/\d\.[^5]/));
		const targetRatios = integerRatios.length ? integerRatios : availableRatios;
		const ratioIndex = Math.max(0, targetRatios.indexOf(props.cameraRatio));

		Setting.setValue('camera.ratio', targetRatios[(ratioIndex + 1) % targetRatios.length]);
	}, [props.cameraRatio, availableRatios]);

	const onCameraReady = useCallback(() => {
		setCameraReady(true);
	}, []);

	const [takingPicture, setTakingPicture] = useState(false);
	const takingPictureRef = useRef(takingPicture);
	takingPictureRef.current = takingPicture;
	const onTakePicture = useCallback(async () => {
		if (takingPictureRef.current) return;
		setTakingPicture(true);
		try {
			const picture = await cameraRef.current.takePhoto();
			if (picture) {
				props.onPhoto({ uri: picture.path });
			}
		} finally {
			setTakingPicture(false);
		}
	}, [props.onPhoto]);


	let content;
	if (!hasPermission) {
		content = <View style={styles.loadingContainer}>
			<Text>
				{requestingPermissions ? _('Waiting for camera permission...') : _('Missing camera permission')}
			</Text>
			<Text>{_('The camera permission is required to take pictures.')}</Text>
			<LinkButton onPress={onDeviceSettingsClick}>{_('Open settings')}</LinkButton>
			<PrimaryButton onPress={props.onCancel}>{_('Go back')}</PrimaryButton>
		</View>;
	} else if (!device) {
		content = <View style={styles.loadingContainer}>
			<Text>
				{_('No camera device available!')}
			</Text>
			<PrimaryButton onPress={props.onCancel}>{_('Go back')}</PrimaryButton>
		</View>;
	} else {
		content = <>
			<CameraComponent
				ref={cameraRef}
				style={styles.camera}
				device={device}
				onInitialized={onCameraReady}
				resizeMode='cover'
				photo={true}
				isActive={true}
				format={format}

				enableZoomGesture={true}
			/>
			<ActionButtons
				themeId={props.themeId}
				onCameraReverse={onCameraReverse}
				cameraDirection={props.cameraType}
				cameraRatio={format ? pixelRectToAspectRatio({ width: format.photoWidth, height: format.photoHeight }) : null}
				onSetCameraRatio={onNextCameraRatio}
				onTakePicture={onTakePicture}
				takingPicture={takingPicture}
				onCancelPhoto={props.onCancel}
				cameraReady={cameraReady}
			/>
		</>;
	}

	return (
		<View style={styles.container}>
			{content}
		</View>
	);
};

const mapStateToProps = (state: AppState) => {
	return {
		themeId: state.settings.theme,
		cameraRatio: state.settings['camera.ratio'],
		cameraType: state.settings['camera.type'],
	};
};

export default connect(mapStateToProps)(CameraViewComponent);
