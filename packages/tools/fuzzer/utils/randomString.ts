type OnRandomInt = (low: number, high: number)=> number;

const randomString = (nextRandomInteger: OnRandomInt) => (length: number) => {
	const charCodes = [];
	for (let i = 0; i < length; i++) {
		charCodes.push(nextRandomInteger(0, 0xFFFF));
	}

	let text = String.fromCharCode(...charCodes);
	// Normalize to avoid differences when reading/writing content from Joplin clients.
	// TODO: Can the note comparison logic be adjusted to remove some of this?
	text = text.replace(/\p{C}/ug, '-'); // Control characters

	// Remove invalid UTF-8
	text = new TextDecoder().decode(new TextEncoder().encode(text));
	return text;
};

export default randomString;
