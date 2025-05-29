import { filename, toForwardSlashes } from '@joplin/utils/path';
import * as esbuild from 'esbuild';
import { existsSync } from 'fs';
import { writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import * as posixPath from 'path/posix';

// Set to true to print a summary of which files contribute most to the output
const computeFileSizeStats = true;

// Note: Roughly based on js-draw's use of esbuild:
// https://github.com/personalizedrefrigerator/js-draw/blob/6fe6d6821402a08a8d17f15a8f48d95e5d7b084f/packages/build-tool/src/BundledFile.ts#L64
const makeBuildContext = (entryPoint: string, renderer: boolean) => {
	return esbuild.context({
		entryPoints: [entryPoint],
		outfile: `${filename(entryPoint)}.bundle.js`,
		bundle: true,
		minify: true,
		sourcemap: true,
		metafile: computeFileSizeStats,
		platform: 'node',
		target: ['node20.0'],
		mainFields: renderer ? ['browser', 'main'] : ['main'],
		plugins: [
			{
				name: 'joplin--load-imports',
				setup: build => {
					const externalRegex = /^(.*\.node|sqlite3|electron|@electron\/remote\/.*|electron\/.*|@mapbox\/node-pre-gyp|jsdom)$/;
					const baseDir = dirname(__dirname);
					const baseNodeModules = join(baseDir, 'node_modules');
					build.onResolve({ filter: externalRegex }, args => {
						if (args.path === 'electron' || args.path.startsWith('electron/')) {
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

						console.log('External path:', path, args.importer);

						return {
							path,
							external: true,
						};
					});

					// Rewrite imports to prefer .js files to .ts. Otherwise, certain files are duplicated when
					// resolved.
					build.onResolve({ filter: /^\./ }, args => {
						try {
							let path = require.resolve(args.path, { paths: [args.resolveDir, baseNodeModules, baseDir] });
							if (path.endsWith('.ts')) {
								const alternative = path.replace(/\.ts$/, '.js');
								if (existsSync(alternative)) {
									path = alternative;
								}
							}
							return {
								path,
							};
						} catch (error) {
							return {
								errors: [
									{
										text: `Failed to import: ${error}`,
										detail: error,
										location: { file: args.importer },
									},
								],
							};
						}
					});
				},
			},
		],
	});
};

const bundleJs = async () => {
	const entryPoints = [
		{ fileName: 'main.js', renderer: false },
		{ fileName: 'main-html.js', renderer: true },
	];
	for (const { fileName, renderer } of entryPoints) {
		const compiler = await makeBuildContext(fileName, renderer);
		const result = await compiler.rebuild();
		if (computeFileSizeStats) {
			await writeFile(`${fileName}.meta.json`, JSON.stringify(result.metafile));
		}
		await compiler.dispose();
	}
};

export default bundleJs;
