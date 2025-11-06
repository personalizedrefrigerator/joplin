
type OnRandomInt = (low: number, high: number)=> number;

const randomString = (randInt: OnRandomInt, length: number) => {
	const charCodes = [];
	for (let i = 0; i < length; i++) {
		charCodes.push(randInt(0, 0xFFFF));
	}

	let text = String.fromCharCode(...charCodes);
	// Normalize (TODO: Can the note comparison logic be adjusted to remove some of this?)
	text = text.normalize();
	text = text.replace(/[\r\b\f\v\0\u007F]/g, '!');
	text = text.replace(/\p{C}/ug, '-'); // Other control characters

	// Remove invalid UTF-8
	text = new TextDecoder().decode(new TextEncoder().encode(text));
	return text;
};

export default randomString;
