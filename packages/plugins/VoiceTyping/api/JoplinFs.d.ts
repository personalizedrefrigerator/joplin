import Plugin from '../Plugin';
export type DownloadFileOptions = {
    /** Path to save the file, relative to the plugin's data directory. */
    outputPath: string;
};
/**
 * This module provides cross-platform access to the file system.
 */
export default class JoplinFs {
    private plugin_;
    constructor(plugin: Plugin);
    private resolvePathInDataDir_;
    /**
     * Downloads and caches the data stored at `url` to a file in the plugin's
     * data directory.
     */
    fetchBlob(url: string, { outputPath: rawOutputPath }: DownloadFileOptions): Promise<void>;
    /** Removes a path in the plugin's data directory */
    remove(rawPath: string): Promise<void>;
    /** Returns whether a path exists (relative to a plugin's data directory) */
    exists(rawPath: string): Promise<boolean>;
    /**
     * Reads the file stored at `path` as a `Blob`.
     *
     * Currently, this is mobile-only.
     */
    readBlob(_path: string): Promise<Blob>;
}
