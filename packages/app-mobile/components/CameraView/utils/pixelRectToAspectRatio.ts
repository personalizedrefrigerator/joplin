import Rect from './Rect';

const pixelRectToAspectRatio = (pixelRect: Rect) => {
	// Round to the nearest thousandth to avoid trailing 0.00000000001s
	const round = (value: number) => Math.round(value * 1000) / 1000;

	// 640x480 should correspond to 4:3:
	const scale = 4 / 640; // = 3 / 480
	return `${round(pixelRect.width * scale)}:${round(pixelRect.height * scale)}`;
};

export default pixelRectToAspectRatio;
