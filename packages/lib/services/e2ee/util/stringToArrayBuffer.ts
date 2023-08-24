
// Converts a string that may contain invalid unicode characters
// to an ArrayBuffer
const stringToArrayBuffer = (text: string) => {
	const buffer = new ArrayBuffer(text.length * 2);
	const view = new DataView(buffer);

	for (let i = 0; i < text.length; i++) {
		// false: Big endian
		view.setUint16(i * 2, text.charCodeAt(i), false);
	}

	return buffer;
};

export default stringToArrayBuffer;
