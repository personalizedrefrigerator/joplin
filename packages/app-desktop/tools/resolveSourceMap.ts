import { execCommand } from '@joplin/utils';
import { dirname, relative } from 'path';
import { createInterface } from 'readline/promises';
const { wrapCallSite } = require('source-map-support');

/* eslint-disable no-console */

console.log('Use this tool to resolve (line:column) pairs from error messages.');
console.log('To ensure that errors are resolved accurately, be sure to build');
console.log('Joplin from the same version/commit that produced the error.');

let gitHash: string|null = null;
const getCurrentGitHash = async () => {
	gitHash ??= await execCommand(['git', 'log', '-1', '--pretty="%H"']);
	// Remove quotes
	gitHash = gitHash.replace(/^"(.*)"$/, '$1');
	return gitHash;
};

const resolveLine = (lineNumber: number, columnNumber: number, fileName = 'main-html.bundle.js') => {
	// Note: This is an undocumented function provided by source-map-support. It
	// may change in the future:
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

