
const aspectRatioToPixelRect = (ratio: string) => {
	const match = /^(\d+\.?\d*):(\d+\.?\d*)$/.exec(ratio);
	if (!match) return { width: 0, height: 0 };

	// 640x480 should correspond to 4:3. To do this, scale by 480/3 = 640/4:
	return { width: Number(match[1]) * 640 / 4, height: Number(match[2]) * 480 / 3 };
};

export default aspectRatioToPixelRect;
