import { createInterface } from 'readline/promises';

const iterateStdin = async function*(prompt: string) {
	let done = false;
	let buffer: string[] = [];

	let nextLineListeners: (()=> void)[] = [];
	const dispatchAllListeners = () => {
		const listeners = nextLineListeners;
		nextLineListeners = [];
		for (const listener of listeners) {
			listener();
		}
	};

	const rl = createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	rl.setPrompt(prompt);
	rl.on('line', (line) => {
		buffer.push(line);
		dispatchAllListeners();
	});
	rl.on('close', () => {
		done = true;
		dispatchAllListeners();
	});

	const nextLines = () => {
		return new Promise<string|null>(resolve => {
			if (done) {
				resolve(null);
			} else if (buffer.length > 0) {
				resolve(buffer.join('\n'));
				buffer = [];
			} else {
				nextLineListeners.push(() => {
					resolve(buffer.join('\n'));
					buffer = [];
				});
			}
		});
	};

	while (!done) {
		rl.prompt();
		const lines = await nextLines();
		yield lines;
	}
};

export default iterateStdin;
