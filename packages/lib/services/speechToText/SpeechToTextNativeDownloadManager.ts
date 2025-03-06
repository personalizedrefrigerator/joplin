import Logger from '@joplin/utils/Logger';
import { SpeechToTextDownloadManager } from './types';
import shim from '../../shim';
const md5 = require('md5');

const logger = Logger.create('voiceTyping');

interface DownloadManagerOptions {
	modelId: string;
	modelLocalFilepath: string;
	uuidPath: string;
	downloadUrl: string;
}

export default class SpeechToTextNativeDownloadManager implements SpeechToTextDownloadManager {
	private readonly modelLocalFilepath_: string;
	private readonly uuidPath_: string;
	private readonly downloadUrl_: string;
	private readonly modelId_: string;

	public constructor({ modelLocalFilepath, uuidPath, downloadUrl, modelId }: DownloadManagerOptions) {
		this.downloadUrl_ = downloadUrl;

		modelLocalFilepath = shim.fsDriver().resolveRelativePathWithinDir(
			shim.fsDriver().getAppDirectoryPath(),
			modelLocalFilepath,
		);

		// Prevents cache clearing from deleting all app files
		if (modelLocalFilepath === shim.fsDriver().getAppDirectoryPath()) {
			throw new Error('Invalid local file path!');
		}

		this.modelLocalFilepath_ = modelLocalFilepath;
		this.uuidPath_ = shim.fsDriver().resolveRelativePathWithinDir(
			shim.fsDriver().getAppDirectoryPath(),
			uuidPath,
		);

		this.modelId_ = modelId;
	}

	public getDownloadedModelPath() {
		return this.modelLocalFilepath_;
	}

	public async canUpdateModel() {
		if (!await shim.fsDriver().exists(this.uuidPath_)) {
			// Not downloaded at all
			return false;
		}

		const urlHash = await shim.fsDriver().readFile(this.uuidPath_);
		return urlHash.trim() !== md5(this.downloadUrl_);
	}

	public async isDownloaded() {
		return await shim.fsDriver().exists(this.uuidPath_);
	}

	public async clearCache() {
		await shim.fsDriver().remove(this.modelLocalFilepath_);
	}

	public async download() {
		if (await this.isDownloaded()) {
			throw new Error('Model already downloaded. Call .clearCache() first to re-download.');
		}
		await shim.fsDriver().remove(this.modelLocalFilepath_);
		logger.info(`Downloading model from: ${this.downloadUrl_}`);

		const isZipped = this.downloadUrl_.endsWith('.zip');
		const downloadPath = isZipped ? `${this.modelLocalFilepath_}.zip` : this.modelLocalFilepath_;
		const response = await shim.fetchBlob(this.downloadUrl_, {
			path: downloadPath,
		});
		logger.info(`Downloaded model to: ${downloadPath}`);


		if (!response.ok || response.status >= 400) throw new Error(`Could not download from ${this.downloadUrl_}: Error ${response.status}`);

		if (isZipped) {
			const modelName = this.modelId_;
			const unzipDir = `${shim.fsDriver().getCacheDirectoryPath()}/voice-typing-extract/${modelName}/`;
			try {
				logger.info(`Unzipping ${downloadPath} => ${unzipDir}`);

				await shim.fsDriver().unzip(downloadPath, unzipDir);
				logger.debug(`Unzipped to ${unzipDir}`);

				const contents = await shim.fsDriver().readDirStats(unzipDir);
				if (contents.length !== 1) {
					logger.error('Expected 1 file or directory but got', contents);
					throw new Error(`Expected 1 file or directory, but got ${contents.length}`);
				}

				const fullUnzipPath = `${unzipDir}/${contents[0].path}`;

				logger.info(`Moving ${fullUnzipPath} => ${this.modelLocalFilepath_}`);
				await shim.fsDriver().move(fullUnzipPath, this.modelLocalFilepath_);
			} finally {
				await shim.fsDriver().remove(unzipDir);
				await shim.fsDriver().remove(downloadPath);
			}
		}

		await shim.fsDriver().writeFile(this.uuidPath_, md5(this.downloadUrl_), 'utf8');
		if (!await this.isDownloaded()) {
			logger.warn('Model should be downloaded!');
		} else {
			logger.info('Model stats', await shim.fsDriver().stat(this.modelLocalFilepath_));
		}
	}
}
