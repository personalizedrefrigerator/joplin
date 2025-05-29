import { toForwardSlashes } from '@joplin/utils/path';
import * as esbuild from 'esbuild';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import * as posixPath from 'path/posix';

// Note: Roughly based on js-draw's use of esbuild:
// https://github.com/personalizedrefrigerator/js-draw/blob/6fe6d6821402a08a8d17f15a8f48d95e5d7b084f/packages/build-tool/src/BundledFile.ts#L64
const makeBuildContext = () => {
	return esbuild.context({
		entryPoints: ['main-html.js'],
		bundle: true,
		platform: 'node',
		target: ['node20.0'],
		outfile: 'main-html-out.js',
		plugins: [
			{
				name: 'joplin--load-imports',
				setup: build => {
					const externalRegex = /^(.*\.node|sqlite3|electron|@mapbox\/node-pre-gyp|jsdom)$/;
					const baseDir = dirname(__dirname);
					const baseNodeModules = join(baseDir, 'node_modules');
					build.onResolve({ filter: externalRegex }, args => {
						if (args.path === 'electron') {
							return { path: args.path, external: true, namespace: 'node' };
						}

						let path = posixPath.relative(
							baseDir,
							toForwardSlashes(require.resolve(args.path, { paths: [baseNodeModules, args.resolveDir, baseDir] })),
						);
						if (!path.startsWith('.')) {
							path = `./${path}`;
						}

						if (args.path.endsWith('.node') && path.endsWith('.ts')) {
							// Normal .ts file -- continue.
							return null;
						}

						return {
							path,
							external: true,
						};
					});

					// Rewrite imports to prefer .js files to .ts. Otherwise, certain files are duplicated when
					// resolved.
					build.onResolve({ filter: /^\./ }, args => {
						let path = require.resolve(args.path, { paths: [args.resolveDir, baseNodeModules, baseDir] });
						if (path.endsWith('.ts')) {
							const alternative = path.replace(/\.ts$/, '.js');
							if (existsSync(alternative)) {
								console.log('replace', alternative);
								path = alternative;
							}
						}
						return {
							path,
						};
					});
				},
			},
		],
	});
};

const bundleJs = async () => {
	const compiler = await makeBuildContext();
	await compiler.rebuild();
	await compiler.dispose();
};

export default bundleJs;
