/* eslint-disable multiline-comment-style */

import shim from '../../../shim';
import Plugin from '../Plugin';

export type DownloadFileOptions = {
	/** Path to save the file, relative to the plugin's data directory. */
	outputPath: string;
};

/**
 * This module provides cross-platform access to the file system.
 */
export default class JoplinFs {
	private plugin_: Plugin;

	public constructor(plugin: Plugin) {
		this.plugin_ = plugin;
	}

	private async resolvePathInDataDir_(path: string) {
		const outputDirectory = await this.plugin_.createAndGetDataDir();
		return shim.fsDriver().resolveRelativePathWithinDir(outputDirectory, path);
	}

	/**
	 * Downloads and caches the data stored at `url` to a file in the plugin's
	 * data directory.
	 */
	public async fetchBlob(url: string, { outputPath: rawOutputPath }: DownloadFileOptions) {
		const outputPath = await this.resolvePathInDataDir_(rawOutputPath);
		const response = await shim.fetchBlob(url, { path: outputPath });
		if (!response.ok) {
			throw new Error(`Failed to download from ${JSON.stringify(url)}. Status: ${response.status}.`);
		}
	}

	/** Removes a path in the plugin's data directory */
	public async remove(rawPath: string): Promise<void> {
		if (await this.exists(rawPath)) {
			const path = await this.resolvePathInDataDir_(rawPath);
			await shim.fsDriver().remove(path);
		}
	}

	/** Returns whether a path exists (relative to a plugin's data directory) */
	public async exists(rawPath: string): Promise<boolean> {
		if (!await shim.fsDriver().exists(this.plugin_.dataDir)) {
			return false;
		}

		const path = await this.resolvePathInDataDir_(rawPath);
		return await shim.fsDriver().exists(path);
	}

	/**
	 * Reads the file stored at `path` as a `Blob`.
	 *
	 * Currently, this is mobile-only.
	 */
	public async readBlob(_path: string): Promise<Blob> {
		// For performance reasons, this should be implemented within the plugin WebView.
		throw new Error('Not implemented for the current platform.');
	}
}
