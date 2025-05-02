import * as esbuild from 'esbuild';

const bundleJs = async () => {
	await esbuild.build({
		entryPoints: ['main-html.js'],
		bundle: true,
		platform: 'node',
		target: ['node20.0'],
		outfile: 'main-html-out.js',
		external: ['*.node', 'electron', '@mapbox/node-pre-gyp', 'jsdom'],
	});
};

export default bundleJs;
