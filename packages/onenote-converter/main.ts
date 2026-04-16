import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';

interface RenderOptions {
	sourcePath: string;
	outputDir: string;
	baseDir: string;
}

if (!isMainThread) {
	void (async () => {
		const importer = require('./renderer/pkg/renderer').oneNoteConverter;
		const target: RenderOptions = workerData;
		await importer(target.sourcePath, target.outputDir, target.baseDir);
		parentPort.postMessage(target.outputDir);
	})();
}

const convert = (options: RenderOptions) => {
	// See https://nodejs.org/api/worker_threads.html
	return new Promise<void>((resolve, reject) => {
		const worker = new Worker(__filename, { workerData: options });
		worker.once('message', resolve);
		worker.once('error', reject);
		worker.once('exit', code => {
			if (code !== 0) {
				reject(new Error(`Importer failed (code: ${code})`));
			}
		});
	});
};

export default convert;
