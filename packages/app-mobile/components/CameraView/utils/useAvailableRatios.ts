import { useMemo } from 'react';
import { CameraDeviceFormat } from 'react-native-vision-camera';
import pixelRectToAspectRatio from './pixelRectToAspectRatio';

const useAvailableRatios = (formats: CameraDeviceFormat[]) => {
	return useMemo(() => {
		return formats.map(format => {
			return pixelRectToAspectRatio({ width: format.photoWidth, height: format.photoHeight });
		}).sort().filter((value, index, all) => {
			return (value !== all[index - 1]);
		});
	}, [formats]);
};

export default useAvailableRatios;
