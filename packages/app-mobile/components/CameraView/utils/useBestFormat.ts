import { useMemo } from 'react';
import { CameraDeviceFormat } from 'react-native-vision-camera';
import aspectRatioToPixelRect from './aspectRatioToPixelRect';

const useBestFormat = (deviceFormats: CameraDeviceFormat[], aspectRatio: string) => {
	const format = useMemo(() => {
		const requestedPixelSize = aspectRatioToPixelRect(aspectRatio);
		const sortedFormats = [...deviceFormats].sort((formatA, formatB) => {
			const getDist = (format: CameraDeviceFormat) => {
				// Determines the Euclidean distance between the photo size and the
				// requested size.
				return Math.hypot(
					format.photoWidth - requestedPixelSize.width,
					format.photoHeight - requestedPixelSize.height,
				);
			};
			return getDist(formatA) - getDist(formatB);
		});
		return sortedFormats[0];
	}, [deviceFormats, aspectRatio]);
	return format;
};

export default useBestFormat;
