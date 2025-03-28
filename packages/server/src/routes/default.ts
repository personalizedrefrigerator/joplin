import { SubPath, Response, ResponseType, redirect } from '../utils/routeUtils';
import Router from '../utils/Router';
import { ErrorNotFound, ErrorForbidden } from '../utils/errors';
import { dirname, normalize } from 'path';
import { pathExists } from 'fs-extra';
import * as fs from 'fs-extra';
import { AppContext, RouteType } from '../utils/types';
import { localFileFromUrl } from '../utils/joplinUtils';
import { homeUrl, loginUrl } from '../utils/urlUtils';
import * as mime from '@joplin/lib/mime-utils';

const publicDir = `${dirname(dirname(__dirname))}/public`;

interface PathToFileMap {
	[path: string]: string;
}

// Most static assets should be in /public, but for those that are not, for
// example if they are in node_modules, use the map below.
const pathToFileMap: PathToFileMap = {
	'css/bulma.min.css': 'node_modules/bulma/css/bulma.min.css',
	'css/fontawesome/css/all.min.css': 'node_modules/@fortawesome/fontawesome-free/css/all.min.css',
	'js/zxcvbn.js': 'node_modules/zxcvbn/dist/zxcvbn.js',
	'js/zxcvbn.js.map': 'node_modules/zxcvbn/dist/zxcvbn.js.map',
	'js/jquery.min.js': 'node_modules/jquery/dist/jquery.min.js',
	'js/jquery.min.map': 'node_modules/jquery/dist/jquery.min.map',

	// Hard-coded for now but it could be made dynamic later on
	// 'apps/joplin/css/note.css': 'src/apps/joplin/css/note.css',
};

async function findLocalFile(path: string): Promise<string> {
	const appFilePath = await localFileFromUrl(path);
	if (appFilePath) return appFilePath;

	if (path in pathToFileMap) return pathToFileMap[path];
	// For now a bit of a hack to load FontAwesome fonts.
	if (path.indexOf('css/fontawesome/webfonts/fa-') === 0) return `node_modules/@fortawesome/fontawesome-free/${path.substr(16)}`;

	let localPath = normalize(path);
	if (localPath.indexOf('..') >= 0) throw new ErrorNotFound(`Cannot resolve path: ${path}`);
	localPath = `${publicDir}/${localPath}`;
	if (!(await pathExists(localPath))) throw new ErrorNotFound(`Path not found: ${path}`);

	const stat = await fs.stat(localPath);
	if (stat.isDirectory()) throw new ErrorForbidden(`Directory listing not allowed: ${path}`);

	return localPath;
}

const patchFile = (path: string, fileContent: Buffer): Buffer => {
	const patches: Record<string, (fileContent: Buffer)=> Buffer> = {
		'css/bulma.min.css': fileContent => {
			// We apply the patch here rather than with `yarn patch` because that would mean
			// modifying a minified file, which is likely to break on each new update of Bulma. Dark
			// theme is disabled mostly because we don't want it in published notes, which may have
			// their own style inherited from clipped web pages. Having dark theme in the web UI is
			// not that useful because it's not frequently accessed by users.
			return Buffer.from(fileContent.toString().replace('prefers-color-scheme:dark', 'prefers-color-scheme:dark-disabled-by-patch'), 'utf-8');
		},
	};

	if (patches[path]) return patches[path](fileContent);

	return fileContent;
};

const router = new Router(RouteType.Web);

router.public = true;

// Used to serve static files, so it needs to be public because for example the
// login page, which is public, needs access to the CSS files.
router.get('', async (path: SubPath, ctx: AppContext) => {
	// Redirect to either /login or /home when trying to access the root
	if (!path.id && !path.link) {
		if (ctx.joplin.owner) {
			return redirect(ctx, homeUrl());
		} else {
			return redirect(ctx, loginUrl());
		}
	}

	const localPath = await findLocalFile(path.raw);

	let mimeType: string = mime.fromFilename(localPath);
	if (!mimeType) mimeType = 'application/octet-stream';

	let fileContent: Buffer = await fs.readFile(localPath);
	fileContent = patchFile(path.raw, fileContent);

	const koaResponse = ctx.response;
	koaResponse.body = fileContent;
	koaResponse.set('Content-Type', mimeType);
	koaResponse.set('Content-Length', fileContent.length.toString());
	return new Response(ResponseType.KoaResponse, koaResponse);
});

export default router;
