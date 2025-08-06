
const createTextNode = (content: string|Promise<string>) => {
	const result = document.createTextNode(typeof content === 'string' ? content : '...');
	void (async () => {
		result.textContent = await content;
	})();
	return result;
};

export default createTextNode;
