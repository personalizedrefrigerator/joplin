import { dirname, basename, resolve, normalize, join } from 'path';
import FsDriverBase, { ReadDirStatsOptions, Stat } from '@joplin/lib/fs-driver-base';
import tarExtract, { TarExtractOptions } from './tarExtract';
import tarCreate, { TarCreateOptions } from './tarCreate';
import { Buffer } from 'buffer';
import Logger, { LogLevel, TargetType } from '@joplin/utils/Logger';
const md5 = require('md5');

type FileHandle = {
	reader: ReadableStreamDefaultReader<Uint8Array>;
	buffered: Buffer;
	done: boolean;
};

const removeReservedWords = (fileName: string) => {
	return fileName.replace(/(tmp)$/g, '_$1');
};

const restoreReservedWords = (fileName: string) => {
	return fileName.replace(/_tmp$/g, 'tmp');
};

declare global {
	interface FileSystemDirectoryHandle {
		entries(): AsyncIterable<[string, FileSystemFileHandle|FileSystemDirectoryHandle]>;
		keys(): AsyncIterable<string>;
	}
}

type RemoveOptions = { recursive?: boolean };

const logger = new Logger();
logger.addTarget(TargetType.Console);
logger.setLevel(LogLevel.Warn);

export default class FsDriverWeb extends FsDriverBase {
	private fsRoot_: FileSystemDirectoryHandle;
	private directoryHandleCache_: Map<string, FileSystemDirectoryHandle> = new Map();
	private virtualFiles_: Map<string, File> = new Map();
	private initPromise_: Promise<void>;

	public constructor() {
		super();
		this.initPromise_ = (async () => {
			try {
				this.fsRoot_ = await (await navigator.storage.getDirectory()).getDirectoryHandle('joplin-web', { create: true });
			} catch (error) {
				logger.warn('Failed to create fs-driver:', error);
				throw error;
			}
		})();
	}

	private async pathToDirectoryHandle_(path: string, create = false): Promise<FileSystemDirectoryHandle> {
		await this.initPromise_;
		path = resolve('/', path);

		if (path === '/') {
			return this.fsRoot_;
		}

		if (this.directoryHandleCache_.has(path)) {
			logger.debug('pathToDirectoryHandle_ from cache for', path);
			return this.directoryHandleCache_.get(path);
		}
		logger.debug('pathToDirectoryHandle_', 'path:', path, 'create:', create);

		const parentDirs = dirname(path);
		const parent = await this.pathToDirectoryHandle_(parentDirs, create);
		const folderName = removeReservedWords(basename(path));

		let handle: FileSystemDirectoryHandle;
		try {
			handle = await parent.getDirectoryHandle(folderName, { create });
			this.directoryHandleCache_.set(path, handle);
		} catch (error) {
			// TODO: Handle this better
			logger.warn('Error getting directory handle', error, 'for', path, 'create:', create);
			handle = null;
		}

		return handle;
	}

	private async pathToFileHandle_(path: string, create = false): Promise<FileSystemFileHandle> {
		await this.initPromise_;
		logger.debug('pathToFileHandle_', 'path:', path, 'create:', create);
		const parent = await this.pathToDirectoryHandle_(dirname(path));
		if (!parent) {
			throw new Error(`Can't get file handle for path ${path} -- parent doesn't exist (create: ${create}).`);
		}

		try {
			return parent.getFileHandle(removeReservedWords(basename(path)), { create });
		} catch (error) {
			logger.warn(error, 'getting file handle at path', path, create);
			if (create) {
				throw new Error(`${error} while getting file at path ${path}.`);
			}

			// TODO: This should return null when a file doesn't exist, but should
			// also report errors in other cases.
			return null;
		}
	}

	private async openWriteStream_(path: string, options?: FileSystemCreateWritableOptions) {
		const handle = await this.pathToFileHandle_(path, true);
		const writer = (await handle.createWritable(options)).getWriter();
		await writer.ready;
		return { writer, handle };
	}

	public override async writeFile(
		path: string,
		data: string|ArrayBuffer,
		encoding: BufferEncoding|'buffer' = 'base64',
		options?: FileSystemCreateWritableOptions,
	) {
		logger.debug('writeFile', path);
		const { writer } = await this.openWriteStream_(path, options);
		if (encoding === 'buffer') {
			await writer.write(data);
		} else if (data instanceof ArrayBuffer) {
			throw new Error('Cannot write ArrayBuffer to file without encoding = buffer');
		} else if (encoding === 'utf-8' || encoding === 'utf8') {
			const encoder = new TextEncoder();
			await writer.write(encoder.encode(data));
		} else {
			await writer.write(Buffer.from(data, encoding).buffer);
		}
		await writer.close();
		logger.debug('writeFile done', path);
	}

	public override async appendFile(path: string, content: string, encoding?: BufferEncoding) {
		return this.writeFile(path, content, encoding, { keepExistingData: true });
	}

	public override async remove(path: string, { recursive = true }: RemoveOptions = {}) {
		path = normalize(path);

		this.directoryHandleCache_.clear();
		const dirHandle = await this.pathToDirectoryHandle_(dirname(path));

		if (dirHandle) {
			await dirHandle.removeEntry(basename(path), { recursive });
		} else {
			console.warn(`remove: ENOENT: Parent directory of path ${JSON.stringify(path)} does not exist.`);
		}
	}

	public override async unlink(path: string) {
		return this.remove(path, { recursive: false });
	}

	public async fileAtPath(path: string) {
		path = normalize(path);

		let file: File;
		if (this.virtualFiles_.has(path)) {
			file = this.virtualFiles_.get(path);
		} else {
			const handle = await this.pathToFileHandle_(path);
			file = await handle.getFile();
		}
		return file;
	}

	public async readFile(path: string, encoding: BufferEncoding = 'utf-8') {
		path = normalize(path);
		logger.debug('readFile', path);
		const file = await this.fileAtPath(path);

		if (encoding === 'utf-8' || encoding === 'utf8') {
			return await file.text();
		} else {
			const buffer = Buffer.from(await file.arrayBuffer());
			return buffer.toString(encoding);
		}
	}

	public override async open(path: string, _mode = 'r'): Promise<FileHandle> {
		const file = await this.fileAtPath(path);
		return {
			// TODO: Extra casting required by NodeJS types conflicting with DOM types.
			reader: (file.stream() as unknown as ReadableStream).getReader(),
			buffered: Buffer.from([]),
			done: false,
		};
	}

	public override async readFileChunkAsBuffer(handle: FileHandle, length: number): Promise<Buffer> {
		let read: Buffer = handle.buffered;

		if (handle.buffered.byteLength < length && !handle.done) {
			const { done, value } = await handle.reader.read();
			handle.done = done;
			if (value) {
				if (read.byteLength > 0) {
					read = Buffer.concat([read, value], read.byteLength + value.byteLength);
				} else {
					read = Buffer.from(value);
				}
			}
		}

		const result = read.subarray(0, length);
		handle.buffered = read.subarray(length, read.length);
		if (result.length === 0 && handle.done) {
			return null;
		} else {
			return result;
		}
	}

	public override async readFileChunk(handle: FileHandle, length: number, encoding: BufferEncoding = 'base64') {
		return (await this.readFileChunkAsBuffer(handle, length))?.toString(encoding);
	}

	public override async close(handle: FileHandle) {
		handle.reader.releaseLock();
	}

	public override async mkdir(path: string) {
		logger.debug('mkdir', path);
		await this.pathToDirectoryHandle_(path, true);
	}

	public override async copy(from: string, to: string) {
		const fromFile = await this.fileAtPath(from);
		const toHandle = await this.pathToFileHandle_(to, true);

		const writer = (await toHandle.createWritable()).getWriter();
		await writer.write(fromFile);
		await writer.close();
	}

	public override async stat(path: string, handle?: FileSystemDirectoryHandle|FileSystemFileHandle): Promise<Stat> {
		handle ??= await this.pathToDirectoryHandle_(path) || await this.pathToFileHandle_(path);
		const virtualFile = this.virtualFiles_.get(normalize(path));
		if (!handle && !virtualFile) return null;

		const size = await (async () => {
			if (handle.kind === 'directory') return 0;
			return (virtualFile ?? await handle.getFile()).size;
		})();

		return {
			birthtime: new Date(0),
			mtime: new Date(0),
			path: normalize(path),
			size,
			isDirectory: () => handle.kind === 'directory',
		};
	}

	public override async readDirStats(path: string, options: ReadDirStatsOptions = { recursive: false }): Promise<Stat[]> {
		const readDirStats = async (basePath: string, path: string, dirHandle?: FileSystemDirectoryHandle) => {
			dirHandle ??= await this.pathToDirectoryHandle_(path);
			if (!dirHandle) return null;

			const result: Stat[] = [];
			try {
				for await (const [childInternalName, childHandle] of dirHandle.entries()) {
					const childFileName = restoreReservedWords(childInternalName);
					const childPath = join(path, childFileName);

					const stat = await this.stat(childPath, childHandle);
					result.push({ ...stat, path: join(basePath, childFileName) });

					if (options.recursive && childHandle.kind === 'directory') {
						const childBasePath = join(basePath, childFileName);
						result.push(...await readDirStats(childBasePath, childPath, childHandle));
					}
				}
			} catch (error) {
				throw new Error(`readDirStats error: ${error}, path: ${basePath},${path}`);
			}
			return result;
		};
		return readDirStats('', path);
	}

	public override async exists(path: string) {
		logger.debug('exists?', path);

		if (this.virtualFiles_.has(normalize(path))) {
			return true;
		}

		const parentDir = await this.pathToDirectoryHandle_(dirname(path));
		if (!parentDir) return false;

		const target = basename(path);
		for await (const key of parentDir.keys()) {
			if (key === target) return true;
		}
		return false;
	}

	public resolve(...paths: string[]): string {
		return resolve(...paths);
	}

	public override async md5File(path: string): Promise<string> {
		const fileData = Buffer.from(await (await this.fileAtPath(path)).arrayBuffer());
		return md5(fileData);
	}

	public override async tarExtract(options: TarExtractOptions) {
		await tarExtract({
			cwd: '/cache/',
			...options,
		});
	}

	public override async tarCreate(options: TarCreateOptions, filePaths: string[]) {
		await tarCreate({
			cwd: '/cache/',
			...options,
		}, filePaths);
	}

	public override getCacheDirectoryPath(): string {
		return '/cache/';
	}

	public override getAppDirectoryPath(): string {
		return '/app/';
	}

	public createReadOnlyVirtualFile(path: string, content: File) {
		this.virtualFiles_.set(normalize(path), content);
	}
}
