
const arrayBufferToString = (buffer: ArrayBuffer) => {
	const view = new DataView(buffer);
	const charCodes = [];
	for (let i = 0; i < buffer.byteLength; i += 2) {
		// false: big endian
		charCodes.push(view.getUint16(i, false));
	}
	return String.fromCharCode(...charCodes);
};

export default arrayBufferToString;