import { execCommand } from '@joplin/utils';
import { dirname, relative } from 'path';
import { createInterface } from 'readline/promises';
const { wrapCallSite } = require('source-map-support');

/* eslint-disable no-console */

let gitHash: string|null = null;
const getCurrentGitHash = async () => {
	gitHash ??= await execCommand(['git', 'log', '-1', '--pretty="%H"']);
	// Remove quotes
	gitHash = gitHash.replace(/^"(.*)"$/, '$1');
	return gitHash;
};

// TODO: This is using an internal function of source-map-support.
const resolveLine = (lineNumber: number, columnNumber: number, fileName = 'main-html.bundle.js') => {
	const frame = wrapCallSite({
		getFileName: () => fileName,
		isNative: ()=>false,
		getLineNumber: ()=>lineNumber,
		getColumnNumber: ()=>columnNumber,
	});

	const baseDir = dirname(dirname(dirname(__dirname)));
	const relativeFilePath = relative(baseDir, frame.getFileName());
	return `${relativeFilePath}#L${frame.getLineNumber()}`;
};

const rl = createInterface({
	input: process.stdin,
	output: process.stdout,
});
rl.setPrompt('line:col> ');

rl.on('line', async (line) => {
	const match = /^(\d{1,10}):(\d{1,10})$/.exec(line.trim());
	if (!match) {
		console.error('Invalid format. Expected line:col');
		rl.prompt();
		return;
	}

	const baseUrl = `https://github.com/laurent22/joplin/blob/${await getCurrentGitHash()}/`;
	const lineNumber = Number(match[1]);
	const columnNumber = Number(match[2]);
	console.log('  ', `${baseUrl}${resolveLine(lineNumber, columnNumber)}`);
	rl.prompt();
});

rl.prompt();

