import { extract as tarStreamExtract } from 'tar-stream';
import { resolve, dirname } from 'path';
import shim from '@joplin/lib/shim';
import { chunkSize } from './constants';

interface TarExtractOptions {
	cwd: string;
	file: string;
}

const tarExtract = async (options: TarExtractOptions) => {
	const cwd = options.cwd;

	// resolve doesn't correctly handle file:// or content:// URLs. Thus, we don't resolve relative
	// to cwd if the source is a URL.
	const isSourceUrl = options.file.match(/$[a-z]+:\/\//);
	const filePath = isSourceUrl ? options.file : resolve(cwd, options.file);

	const fsDriver = shim.fsDriver();
	if (!(await fsDriver.exists(filePath))) {
		throw new Error('tarExtract: Source file does not exist');
	}

	const extract = tarStreamExtract({ defaultEncoding: 'base64' });

	extract.on('entry', async (header, stream, next) => {
		const outPath = fsDriver.resolveRelativePathWithinDir(cwd, header.name);

		if (await fsDriver.exists(outPath)) {
			throw new Error(`Extracting ${outPath} would overwrite`);
		}

		// Move to the next item when all available data has been read.
		stream.once('end', () => next());

		if (header.type === 'directory') {
			await fsDriver.mkdir(outPath);
		} else if (header.type === 'file') {
			const parentDir = dirname(outPath);
			await fsDriver.mkdir(parentDir);

			await fsDriver.appendBinaryReadableToFile(outPath, stream);
		} else {
			throw new Error(`Unsupported file system entity type: ${header.type}`);
		}

		// Drain the rest of the stream.
		stream.resume();

	});

	let finished = false;
	const finishPromise = new Promise<void>((resolve, reject) => {
		extract.once('finish', () => {
			finished = true;
			resolve();
		});

		extract.once('error', (error) => {
			reject(error);
		});
	});

	const fileHandle = await fsDriver.open(filePath, 'r');
	const readChunk = async () => {
		const base64 = await fsDriver.readFileChunk(fileHandle, chunkSize, 'base64');
		return base64 && Buffer.from(base64, 'base64');
	};

	try {
		let chunk = await readChunk();
		let nextChunk = await readChunk();
		do {
			extract.write(chunk);

			chunk = nextChunk;
			nextChunk = await readChunk();
		} while (nextChunk !== null && !finished);

		if (chunk !== null) {
			extract.end(chunk);
		} else {
			extract.end();
		}
	} finally {
		await fsDriver.close(fileHandle);
	}

	await finishPromise;
};

export default tarExtract;
