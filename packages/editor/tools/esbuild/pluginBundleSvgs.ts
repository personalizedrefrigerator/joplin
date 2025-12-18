import { resolve } from "path";
import { Plugin } from 'esbuild';
import { readFile } from "fs/promises";

// This plugin is required for building images bundled with the Joplin editors
const pluginBundleSvgs: Plugin = {
	// Supports require(...)ing SVG images
	name: 'joplin--require-svg',
	setup: (build) => {
		// A relative path to an SVG:
		build.onResolve({ filter: /^\.{1,2}\/.*\.svg$/ }, args => ({
			path: resolve(args.resolveDir, args.path),
			namespace: 'joplin-require-svg',
		}));

		build.onLoad({ filter: /^.*$/, namespace: 'joplin-require-svg' }, async args => {
			const fileContent = await readFile(args.path, 'utf-8');
			return { contents: `
				let svg = null;
				export default () => {
					svg ??= (() => {
						const parser = new DOMParser();
						const doc = parser.parseFromString(${JSON.stringify(fileContent)}, 'image/svg+xml');
						return doc.querySelector('svg');
					})();
					return svg.cloneNode(true);
				};
			` };
		});
	},
};

export default pluginBundleSvgs;
