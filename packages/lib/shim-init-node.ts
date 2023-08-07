'use strict';

import fs = require('fs-extra');
const shim = require('./shim').default;
const GeolocationNode = require('./geolocation-node').default;
const { FileApiDriverLocal } = require('./file-api-driver-local');
const { setLocale, defaultLocale, closestSupportedLocale } = require('./locale');
const FsDriverNode = require('./fs-driver-node').default;
const mimeUtils = require('./mime-utils.js').mime;
const Resource = require('./models/Resource').default;
const { _ } = require('./locale');
const http = require('http');
const https = require('https');
import { HttpProxyAgent, HttpsProxyAgent } from 'hpagent';
import type Setting from './models/Setting';
const toRelative = require('relative');
import * as timers from 'timers';
import Note from './models/Note';
import { NoteEntity } from './services/database/types';
import { Agent as NodeHttpAgent } from 'http';
import { Agent as NodeHttpsAgent, AgentOptions as HttpsAgentOptions } from 'https';
const zlib = require('zlib');
const dgram = require('dgram');
const { basename, fileExtension, safeFileExtension } = require('./path-utils');

interface ProxySettings {
	maxConcurrentConnections?: number;
	proxyTimeout?: number;
	proxyEnabled?: boolean;
	proxyUrl?: string;
}
const proxySettings: ProxySettings = {};

function fileExists(filePath: string) {
	try {
		return fs.statSync(filePath).isFile();
	} catch (error) {
		return false;
	}
}

function isUrlHttps(url: string) {
	return url.startsWith('https');
}

function resolveProxyUrl(proxyUrl: string) {
	return (
		proxyUrl ||
		process.env['http_proxy'] ||
		process.env['https_proxy'] ||
		process.env['HTTP_PROXY'] ||
		process.env['HTTPS_PROXY']
	);
}

// https://github.com/sindresorhus/callsites/blob/main/index.js
function callsites() {
	const _prepareStackTrace = Error.prepareStackTrace;
	Error.prepareStackTrace = (_any, stack) => stack;
	const stack = new Error().stack.slice(1);
	Error.prepareStackTrace = _prepareStackTrace;
	return stack;
}

const gunzipFile = function(source: string, destination: string) {
	if (!fileExists(source)) {
		throw new Error(`No such file: ${source}`);
	}

	return new Promise<void>((resolve, reject) => {
		// prepare streams
		const src = fs.createReadStream(source);
		const dest = fs.createWriteStream(destination);

		// extract the archive
		src.pipe(zlib.createGunzip()).pipe(dest);

		// callback on extract completion
		dest.on('close', () => {
			resolve();
		});

		src.on('error', () => {
			reject();
		});

		dest.on('error', () => {
			reject();
		});
	});
};

export const setupProxySettings = (options: ProxySettings) => {
	proxySettings.maxConcurrentConnections = options.maxConcurrentConnections;
	proxySettings.proxyTimeout = options.proxyTimeout;
	proxySettings.proxyEnabled = options.proxyEnabled;
	proxySettings.proxyUrl = options.proxyUrl;
};

let customCAs: Buffer[];
export const setCustomCAs = (cas: string[]) => {
	customCAs = cas.map(path => fs.readFileSync(path));
};

export const shimInit = (options: any = null) => {
	options = {
		sharp: null,
		keytar: null,
		React: null,
		appVersion: null,
		electronBridge: null,
		nodeSqlite: null,
		...options,
	};

	const sharp = options.sharp;
	const keytar = (shim.isWindows() || shim.isMac()) && !shim.isPortable() ? options.keytar : null;
	const appVersion = options.appVersion;


	shim.setNodeSqlite(options.nodeSqlite);

	shim.fsDriver = () => {
		throw new Error('Not implemented');
	};
	shim.FileApiDriverLocal = FileApiDriverLocal;
	shim.Geolocation = GeolocationNode;
	shim.FormData = require('form-data');
	shim.sjclModule = require('./vendor/sjcl.js');
	shim.electronBridge_ = options.electronBridge;

	shim.fsDriver = () => {
		if (!shim.fsDriver_) shim.fsDriver_ = new FsDriverNode();
		return shim.fsDriver_;
	};

	shim.dgram = () => {
		return dgram;
	};

	if (options.React) {
		shim.react = () => {
			return options.React;
		};
	}

	shim.electronBridge = () => {
		return shim.electronBridge_;
	};

	shim.randomBytes = async (count: number) => {
		const buffer = require('crypto').randomBytes(count);
		return Array.from(buffer);
	};

	shim.detectAndSetLocale = function(settings: typeof Setting) {
		let locale = shim.isElectron() ? shim.electronBridge().getLocale() : process.env.LANG;
		if (!locale) locale = defaultLocale();
		locale = locale.split('.');
		locale = locale[0];
		locale = closestSupportedLocale(locale);
		settings.setValue('locale', locale);
		setLocale(locale);
		return locale;
	};

	shim.writeImageToFile = async function(nativeImage: any, mime: string, targetPath: string) {
		if (shim.isElectron()) {
			// For Electron
			let buffer = null;

			mime = mime.toLowerCase();

			if (mime === 'image/png') {
				buffer = nativeImage.toPNG();
			} else if (mime === 'image/jpg' || mime === 'image/jpeg') {
				buffer = nativeImage.toJPEG(90);
			}

			if (!buffer) throw new Error(`Cannot resize image because mime type "${mime}" is not supported: ${targetPath}`);

			await shim.fsDriver().writeFile(targetPath, buffer, 'buffer');
		} else {
			throw new Error('Node support not implemented');
		}
	};

	shim.showMessageBox = (message: string, options: any = null) => {
		if (shim.isElectron()) {
			return shim.electronBridge().showMessageBox(message, options);
		} else {
			throw new Error('Not implemented');
		}
	};

	const handleResizeImage_ = async (filePath: string, targetPath: string, mime: string, resizeLargeImages: string) => {
		const maxDim = Resource.IMAGE_MAX_DIMENSION;

		if (shim.isElectron()) {
			// For Electron
			const nativeImage = require('electron').nativeImage;
			let image = nativeImage.createFromPath(filePath);
			if (image.isEmpty()) throw new Error(`Image is invalid or does not exist: ${filePath}`);

			const size = image.getSize();

			let mustResize = size.width > maxDim || size.height > maxDim;

			if (mustResize && resizeLargeImages === 'ask') {
				const answer = shim.showMessageBox(_('You are about to attach a large image (%dx%d pixels). Would you like to resize it down to %d pixels before attaching it?', size.width, size.height, maxDim), {
					buttons: [_('Yes'), _('No'), _('Cancel')],
				});

				if (answer === 2) return false;

				mustResize = answer === 0;
			}

			if (!mustResize) {
				await shim.fsDriver().copy(filePath, targetPath);
				return true;
			}

			const options: any = {};
			if (size.width > size.height) {
				options.width = maxDim;
			} else {
				options.height = maxDim;
			}

			image = image.resize(options);

			await shim.writeImageToFile(image, mime, targetPath);
		} else {
			// For the CLI tool
			const image = sharp(filePath);
			const md = await image.metadata();

			if (md.width <= maxDim && md.height <= maxDim) {
				shim.fsDriver().copy(filePath, targetPath);
				return true;
			}

			return new Promise((resolve, reject) => {
				image
					.resize(Resource.IMAGE_MAX_DIMENSION, Resource.IMAGE_MAX_DIMENSION, {
						fit: 'inside',
						withoutEnlargement: true,
					})
					.toFile(targetPath, (error: any, info: any) => {
						if (error) {
							reject(error);
						} else {
							resolve(info);
						}
					});
			});
		}

		return true;
	};

	// This is a bit of an ugly method that's used to both create a new resource
	// from a file, and update one. To update a resource, pass the
	// destinationResourceId option. This method is indirectly tested in
	// Api.test.ts.
	shim.createResourceFromPath = async function(filePath: string, defaultProps: any = null, options: any = null) {
		options = { resizeLargeImages: 'always', // 'always', 'ask' or 'never'
			userSideValidation: false,
			destinationResourceId: '', ...options };

		const readChunk = require('read-chunk');
		const imageType = require('image-type');

		const isUpdate = !!options.destinationResourceId;

		const uuid = require('./uuid').default;

		if (!(await fs.pathExists(filePath))) throw new Error(_('Cannot access %s', filePath));

		defaultProps = defaultProps ? defaultProps : {};

		let resourceId = defaultProps.id ? defaultProps.id : uuid.create();
		if (isUpdate) resourceId = options.destinationResourceId;

		let resource = isUpdate ? {} : Resource.new();
		resource.id = resourceId;

		// When this is an update we auto-update the mime type, in case the
		// content type has changed, but we keep the title. It is still possible
		// to modify the title on update using defaultProps.
		resource.mime = mimeUtils.fromFilename(filePath);
		if (!isUpdate) resource.title = basename(filePath);

		let fileExt = safeFileExtension(fileExtension(filePath));

		if (!resource.mime) {
			const buffer = await readChunk(filePath, 0, 64);
			const detectedType = imageType(buffer);

			if (detectedType) {
				fileExt = detectedType.ext;
				resource.mime = detectedType.mime;
			} else {
				resource.mime = 'application/octet-stream';
			}
		}

		resource.file_extension = fileExt;

		const targetPath = Resource.fullPath(resource);

		if (options.resizeLargeImages !== 'never' && ['image/jpeg', 'image/jpg', 'image/png'].includes(resource.mime)) {
			const ok = await handleResizeImage_(filePath, targetPath, resource.mime, options.resizeLargeImages);
			if (!ok) return null;
		} else {
			await fs.copy(filePath, targetPath, { overwrite: true });
		}

		// While a whole object can be passed as defaultProps, we only just
		// support the title and ID (used above). Any other prop should be
		// derived from the provided file.
		if ('title' in defaultProps) resource.title = defaultProps.title;

		const itDoes = await shim.fsDriver().waitTillExists(targetPath);
		if (!itDoes) throw new Error(`Resource file was not created: ${targetPath}`);

		const fileStat = await shim.fsDriver().stat(targetPath);
		resource.size = fileStat.size;

		const saveOptions: any = { isNew: true };
		if (options.userSideValidation) saveOptions.userSideValidation = true;

		if (isUpdate) {
			saveOptions.isNew = false;
			const tempPath = `${targetPath}.tmp`;
			await shim.fsDriver().move(targetPath, tempPath);
			resource = await Resource.save(resource, saveOptions);
			await Resource.updateResourceBlobContent(resource.id, tempPath);
			await shim.fsDriver().remove(tempPath);
			return resource;
		} else {
			return Resource.save(resource, saveOptions);
		}
	};

	shim.attachFileToNoteBody = async (noteBody: string, filePath: string, position: number|null = null, options: any = null) => {
		options = { createFileURL: false, ...options };

		const { basename } = require('path');
		const { escapeTitleText } = require('./markdownUtils').default;
		const { toFileProtocolPath } = require('./path-utils');

		let resource = null;
		if (!options.createFileURL) {
			resource = await shim.createResourceFromPath(filePath, null, options);
			if (!resource) return null;
		}

		const newBody = [];

		if (position === null) {
			position = noteBody ? noteBody.length : 0;
		}

		if (noteBody && position) newBody.push(noteBody.substr(0, position));

		if (!options.createFileURL) {
			newBody.push(Resource.markdownTag(resource));
		} else {
			const filename = escapeTitleText(basename(filePath)); // to get same filename as standard drag and drop
			const fileURL = `[${filename}](${toFileProtocolPath(filePath)})`;
			newBody.push(fileURL);
		}

		if (noteBody) newBody.push(noteBody.substr(position));

		return newBody.join('\n\n');
	};

	shim.attachFileToNote = async function(note: NoteEntity, filePath: string, position: number|null = null, options: any = null) {
		const newBody = await shim.attachFileToNoteBody(note.body, filePath, position, options);
		if (!newBody) return null;

		const newNote = { ...note, body: newBody };
		return Note.save(newNote);
	};

	shim.imageToDataUrl = async (filePath: string, maxSize: number) => {
		if (shim.isElectron()) {
			const nativeImage = require('electron').nativeImage;
			let image = nativeImage.createFromPath(filePath);
			if (!image) throw new Error(`Could not load image: ${filePath}`);

			const ext = fileExtension(filePath).toLowerCase();
			if (!['jpg', 'jpeg', 'png'].includes(ext)) throw new Error(`Unsupported file format: ${ext}`);

			if (maxSize) {
				const size = image.getSize();

				if (size.width > maxSize || size.height > maxSize) {
					console.warn(`Image is over ${maxSize}px - resizing it: ${filePath}`);

					const options: any = {};
					if (size.width > size.height) {
						options.width = maxSize;
					} else {
						options.height = maxSize;
					}

					image = image.resize(options);
				}
			}

			return image.toDataURL();
		} else {
			throw new Error('Unsupported method');
		}
	},

	shim.imageFromDataUrl = async (imageDataUrl: string, filePath: string, options: any = null) => {
		if (options === null) options = {};

		if (shim.isElectron()) {
			const nativeImage = require('electron').nativeImage;
			let image = nativeImage.createFromDataURL(imageDataUrl);
			if (image.isEmpty()) throw new Error('Could not convert data URL to image - perhaps the format is not supported (eg. image/gif)'); // Would throw for example if the image format is no supported (eg. image/gif)
			if (options.cropRect) {
				// Crop rectangle values need to be rounded or the crop() call will fail
				const c = options.cropRect;
				if ('x' in c) c.x = Math.round(c.x);
				if ('y' in c) c.y = Math.round(c.y);
				if ('width' in c) c.width = Math.round(c.width);
				if ('height' in c) c.height = Math.round(c.height);
				image = image.crop(c);
			}
			const mime = mimeUtils.fromDataUrl(imageDataUrl);
			await shim.writeImageToFile(image, mime, filePath);
		} else {
			if (options.cropRect) throw new Error('Crop rect not supported in Node');

			const imageDataURI = require('image-data-uri');
			const result = imageDataURI.decode(imageDataUrl);
			await shim.fsDriver().writeFile(filePath, result.dataBuffer, 'buffer');
		}
	};

	const nodeFetch = require('node-fetch');

	// Not used??
	shim.readLocalFileBase64 = (path: string) => {
		const data = fs.readFileSync(path);
		return new Buffer(data).toString('base64');
	};

	shim.httpAgent_ = null;

	shim.httpAgent = (url: string) => {
		if (!shim.httpAgent_) {
			const AgentSettings = {
				keepAlive: true,
				maxSockets: 1,
				keepAliveMsecs: 5000,
			};
			shim.httpAgent_ = {
				http: new http.Agent(AgentSettings),
				https: new https.Agent(AgentSettings),
			};
		}
		return url.startsWith('https') ? shim.httpAgent_.https : shim.httpAgent_.http;
	};

	const proxyAgent = (serverUrl: string, proxyUrl: string, options?: HttpsAgentOptions) => {
		const proxyAgentConfig = {
			...options,
			keepAlive: true,
			maxSockets: proxySettings.maxConcurrentConnections,
			keepAliveMsecs: 5000,
			proxy: proxyUrl,
			timeout: proxySettings.proxyTimeout * 1000,
		};

		// Based on https://github.com/delvedor/hpagent#usage
		if (!isUrlHttps(proxyUrl) && !isUrlHttps(serverUrl)) {
			return new HttpProxyAgent(proxyAgentConfig);
		} else if (isUrlHttps(proxyUrl) && !isUrlHttps(serverUrl)) {
			return new HttpProxyAgent(proxyAgentConfig);
		} else if (!isUrlHttps(proxyUrl) && isUrlHttps(serverUrl)) {
			return new HttpsProxyAgent(proxyAgentConfig);
		} else {
			return new HttpsProxyAgent(proxyAgentConfig);
		}
	};

	const getFetchAgent = (url: string): NodeHttpAgent => {
		const resolvedProxyUrl = resolveProxyUrl(proxySettings.proxyUrl);
		const httpsOptions: HttpsAgentOptions = {
			ca: customCAs,
		};

		if (resolvedProxyUrl && proxySettings.proxyEnabled) {
			return proxyAgent(url, resolvedProxyUrl, httpsOptions);
		} else {
			return isUrlHttps(url) ? new NodeHttpsAgent(httpsOptions) : null;
		}
	};

	shim.fetch = async (url: string, options: any = {}) => {
		try { // Check if the url is valid
			new URL(url);
		} catch (error) { // If the url is not valid, a TypeError will be thrown
			throw new Error(`Not a valid URL: ${url}`);
		}
		options.agent = getFetchAgent(url);
		return shim.fetchWithRetry(() => {
			return nodeFetch(url, options);
		}, options);
	};

	shim.fetchBlob = async function(url: string, options: any) {
		if (!options || !options.path) throw new Error('fetchBlob: target file path is missing');
		if (!options.method) options.method = 'GET';
		// if (!('maxRetry' in options)) options.maxRetry = 5;

		const urlParse = require('url').parse;

		const parsedUrl: URL = urlParse(url.trim());
		const method = options.method ? options.method : 'GET';
		const http = parsedUrl.protocol.toLowerCase() === 'http:' ? require('follow-redirects').http : require('follow-redirects').https;
		const headers = options.headers ? options.headers : {};
		const filePath = options.path;

		const makeResponse = (response: any) => {
			return {
				ok: response.statusCode < 400,
				path: filePath,
				text: () => {
					return response.statusMessage;
				},
				json: () => {
					return { message: `${response.statusCode}: ${response.statusMessage}` };
				},
				status: response.statusCode,
				headers: response.headers,
			};
		};

		const urlQuery = (parsedUrl as any).query;

		const requestOptions: any = {
			protocol: parsedUrl.protocol,
			host: parsedUrl.hostname,
			port: parsedUrl.port,
			method: method,
			path: parsedUrl.pathname + (urlQuery ? `?${urlQuery}` : ''),
			headers: headers,
		};

		requestOptions.agent = getFetchAgent(url);

		const doFetchOperation = async () => {
			return new Promise((resolve, reject) => {
				let file: fs.WriteStream|null = null;

				const cleanUpOnError = (error: any) => {
					// We ignore any unlink error as we only want to report on the main error
					void fs.unlink(filePath)
					// eslint-disable-next-line promise/prefer-await-to-then -- Old code before rule was applied
						.catch(() => {})
					// eslint-disable-next-line promise/prefer-await-to-then -- Old code before rule was applied
						.then(() => {
							if (file) {
								file.close(() => {
									file = null;
									reject(error);
								});
							} else {
								reject(error);
							}
						});
				};

				try {
					// Note: relative paths aren't supported
					file = fs.createWriteStream(filePath);

					file.on('error', (error) => {
						cleanUpOnError(error);
					});

					const request = http.request(requestOptions, (response: any) => {
						response.pipe(file);

						const isGzipped = response.headers['content-encoding'] === 'gzip';

						file.on('finish', () => {
							file.close(async () => {
								if (isGzipped) {
									const gzipFilePath = `${filePath}.gzip`;
									await shim.fsDriver().move(filePath, gzipFilePath);

									try {
										await gunzipFile(gzipFilePath, filePath);
										resolve(makeResponse(response));
									} catch (error) {
										cleanUpOnError(error);
									}

									shim.fsDriver().remove(gzipFilePath);
								} else {
									resolve(makeResponse(response));
								}
							});
						});
					});

					request.on('error', (error: any) => {
						cleanUpOnError(error);
					});

					request.end();
				} catch (error) {
					cleanUpOnError(error);
				}
			});
		};

		return shim.fetchWithRetry(doFetchOperation, options);
	};

	shim.uploadBlob = async function(url: string, options: any) {
		if (!options || !options.path) throw new Error('uploadBlob: source file path is missing');
		const content = await fs.readFile(options.path);
		options = { ...options, body: content };
		return shim.fetch(url, options);
	};

	shim.stringByteLength = (string: string) => {
		return Buffer.byteLength(string, 'utf-8');
	};

	shim.Buffer = Buffer;

	shim.openUrl = (url: string) => {
		// Returns true if it opens the file successfully; returns false if it could
		// not find the file.
		return shim.electronBridge().openExternal(url);
	};

	shim.openOrCreateFile = (filepath: string, defaultContents: string) => {
		// If the file doesn't exist, create it
		if (!fs.existsSync(filepath)) {
			fs.writeFile(filepath, defaultContents, 'utf-8', (error) => {
				if (error) {
					console.error(`error: ${error}`);
				}
			});
		}

		// Open the file
		// Don't use openUrl() there.
		// The underneath require('electron').shell.openExternal() has a bug
		// https://github.com/electron/electron/issues/31347

		return shim.electronBridge().openItem(filepath);
	};

	shim.waitForFrame = () => {};

	shim.appVersion = () => {
		if (appVersion) return appVersion();
		// Should not happen but don't throw an error because version number is
		// used in error messages.
		return 'unknown-version!';
	};

	shim.pathRelativeToCwd = (path: string) => {
		return toRelative(process.cwd(), path);
	};

	shim.setTimeout = (fn: ()=> void, interval: number) => {
		return timers.setTimeout(fn, interval);
	};

	shim.setInterval = (fn: ()=> void, interval: number) => {
		return timers.setInterval(fn, interval);
	};

	shim.clearTimeout = (id: ReturnType<typeof timers.setTimeout>) => {
		return timers.clearTimeout(id);
	};

	shim.clearInterval = (id: ReturnType<typeof timers.setInterval>) => {
		return timers.clearInterval(id);
	};

	shim.keytar = () => {
		return keytar;
	};

	shim.requireDynamic = (path: string) => {
		if (path.indexOf('.') === 0) {
			const sites = callsites() as any;
			if (sites.length <= 1) throw new Error(`Cannot require file (1) ${path}`);
			const filename = sites[1].getFileName();
			if (!filename) throw new Error(`Cannot require file (2) ${path}`);

			const fileDirName = require('path').dirname(filename);
			return require(`${fileDirName}/${path}`);
		} else {
			return require(path);
		}
	};
};

