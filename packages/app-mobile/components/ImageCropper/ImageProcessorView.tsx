import * as React from 'react';
import { LayoutChangeEvent, Platform, View, StyleSheet } from 'react-native';
import { GLView, ExpoWebGLRenderingContext } from 'expo-gl';
import { useCallback, useMemo, useState } from 'react';
import ImageProcessor, { ImageSource } from './utils/ImageProcessor';
import useAsyncEffect from '@joplin/lib/hooks/useAsyncEffect';
import shim from '@joplin/lib/shim';
import { toFileProtocolPath } from '@joplin/utils/path';
import getImageDimensions from '../../utils/image/getImageDimensions';
import { Mat33, Vec2 } from '@js-draw/math';
import { msleep } from '@joplin/utils/time';
import ResizeOverlay from './ResizeOverlay';

interface Props {
	imageUri: string;
	imageMime: string;
	//onSubmit: () => void;
}

const useImageSize = (uri: string) => {
	const [ size, setSize ] = useState<Vec2>(Vec2.zero);
	useAsyncEffect(async event => {
		const dimens = await getImageDimensions(uri);
		if (event.cancelled) return;
		setSize(Vec2.of(dimens.width, dimens.height));
	}, [uri]);
	return size;
};

const ImageProcessorView: React.FC<Props> = ({ imageUri, imageMime }) => {
	const [ image, setImage ] = useState<ImageSource|null>(null);
	const [ gl, setGl ] = useState<ExpoWebGLRenderingContext|null>();
	const size = useImageSize(imageUri);
	const [screenSize, setScreenSize] = useState<Vec2>(Vec2.of(1, 1));
	const onScreenLayout = useCallback((event: LayoutChangeEvent) => {
		setScreenSize(Vec2.of(
			event.nativeEvent.layout.width,
			event.nativeEvent.layout.height,
		));
	}, []);

	useAsyncEffect(async (event) => {
		if (Platform.OS === 'web') {
			const fsDriver = shim.fsDriver();
			const uri = await fsDriver.readFile(imageUri, 'base64');
			if (event.cancelled) return;
			const image = new Image();
			const loadPromise = new Promise<void>((resolve, reject) => {
				image.onload = () => resolve();
				image.onerror = () => reject(new Error('Image load failed'));
			});
			image.src = `data:${imageMime};base64,${uri}`;
			await loadPromise;
			console.log('loaded image', image.complete);
			setImage(image);
		} else {
			setImage({ localUri: toFileProtocolPath(imageUri) });
		}
	}, [imageUri, imageMime]);

	const imageProcessor = useMemo(() => {
		return gl ? new ImageProcessor(gl) : null;
	}, [gl]);

	// A matrix that converts from screen space to clip space
	const clipSpaceToImage = useMemo(() => {
		const screenCenter = screenSize.times(0.5);
		const scale = Math.min(
			screenSize.x / size.x,
			screenSize.y / size.y,
		);
		const unscaleImage = Mat33.scaling2D(scale, screenCenter);
		return Mat33.identity
			.rightMul(unscaleImage)
			.rightMul(Mat33.scaling2D(Vec2.of(size.x / 2, size.y / 2), Vec2.zero))
			.rightMul(Mat33.translation(Vec2.of(1, 1)));
	}, [screenSize, size]);

	const screenToClipSpace = useMemo(() => {
		return Mat33
			.translation(Vec2.of(-1, -1))
			.rightMul(Mat33.scaling2D(Vec2.of(2/screenSize.x, 2/screenSize.y)))
	}, [screenSize]);

	const onRender = useCallback(() => {
		if (!gl || !size) return;

		gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
		gl.clearColor(0.0, 0.0, 0.0, 1.0);

		if (imageProcessor) {
			const transform = screenToClipSpace.rightMul(clipSpaceToImage);
			imageProcessor.rerender(image, transform);
		}

		gl.flush();
		gl.endFrameEXP();
	}, [gl, imageProcessor, image, clipSpaceToImage]);
	useAsyncEffect(async (event) => {
		while (!event.cancelled) {
			onRender();
			await msleep(1.0);
		}
	}, [ onRender ]);

	const onContextCreate = useCallback((gl: ExpoWebGLRenderingContext) => {
		setGl(gl);
	}, []);

	return <View style={StyleSheet.absoluteFill} testID='image-processor'>
		<GLView
			style={StyleSheet.absoluteFill}
			onContextCreate={onContextCreate}
			onLayout={onScreenLayout}
		/>
		<ResizeOverlay
			imageSize={size}
			clipSpaceToImage={clipSpaceToImage}
			screenToClipSpace={screenToClipSpace}
		/>
	</View>;
};

export default ImageProcessorView;
