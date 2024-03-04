import { net, protocol } from 'electron';
import { dirname, resolve, normalize, join } from 'path';
import { pathToFileURL } from 'url';
import { contentProtocolName } from './constants';
import resolvePathWithinDir from '@joplin/lib/utils/resolvePathWithinDir';
import { LoggerWrapper } from '@joplin/utils/Logger';


export interface CustomProtocolHandler {
	allowReadAccessToDirectory(path: string): void;
	allowReadAccessToFile(...path: string[]): { remove(): void };
}


// Creating a custom protocol allows us to isolate iframes by giving them
// different domain names from the main Joplin app.
//
// For example, an iframe with url joplin-content://note-viewer/path/to/iframe.html will run
// in a different process from a parent frame with url file://path/to/iframe.html.
//
// See note_viewer_isolation.md for why this is important.
//
// TODO: Use Logger.create (doesn't work for now because Logger is only initialized
// in the main process.)
const handleCustomProtocols = (logger: LoggerWrapper): CustomProtocolHandler => {
	const readableDirectories: string[] = [];
	const readableFiles = new Set<string>();

	// See also the protocol.handle example: https://www.electronjs.org/docs/latest/api/protocol#protocolhandlescheme-handler
	protocol.handle(contentProtocolName, request => {
		const url = new URL(request.url);
		const host = url.host;

		let pathname = normalize(url.pathname);

		// On Windows, pathname can be normalized to
		//   \C:\path\name\here
		// (with an extra slash at the beginning).
		if (pathname.startsWith('\\')) {
			pathname = pathname.substring(1);
		}

		// See https://security.stackexchange.com/a/123723
		if (pathname.startsWith('..')) {
			throw new Error(`Invalid URL (not absolute), ${request.url}`);
		}

		const allowedHosts = ['note-viewer'];

		// Path from which `pathname` should be resolved
		let rootDirectory = null;

		if (allowedHosts.includes(host)) {
			if (readableFiles.has(pathname)) {
				rootDirectory = '';
			} else {
				for (const readableDirectory of readableDirectories) {
					if (resolvePathWithinDir(readableDirectory, pathname)) {
						rootDirectory = '';
						break;
					}
				}
			}
		} else {
			throw new Error(`Invalid URL ${request.url}`);
		}

		if (rootDirectory === null) {
			throw new Error(`Read access not granted for URL ${request.url}`);
		}

		const targetFile = join(rootDirectory, pathname);

		const asFileUrl = pathToFileURL(targetFile).toString();
		return net.fetch(asFileUrl);
	});

	const appBundleDirectory = dirname(dirname(__dirname));
	return {
		allowReadAccessToDirectory: (path: string) => {
			const allowedPath = resolve(appBundleDirectory, path);
			logger.info('protocol handler: Allow read access to directory', allowedPath);

			readableDirectories.push(allowedPath);
		},
		allowReadAccessToFile: (...paths: string[]) => {
			const resolvedPaths = paths.map(p => resolve(appBundleDirectory, p));
			for (const path of resolvedPaths) {
				readableFiles.add(path);
			}

			return {
				remove: () => {
					for (const path of resolvedPaths) {
						readableFiles.delete(path);
					}
				},
			};
		},
	};
};

export default handleCustomProtocols;
