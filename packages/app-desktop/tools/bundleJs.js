
const { join, resolve, dirname } = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// Use JavaScript for this file and not TypeScript because
// this might run before/at the same time as `tsc`.

const rendererDirectory = resolve(__dirname, '../services/isolatedRenderer/renderer/');

const webpackOptions = mode => ({
	context: dirname(__dirname),
	entry: join(rendererDirectory, 'iframe.ts'),
	mode,
	output: {
		path: rendererDirectory,
		filename: 'iframe.bundle.js',

		// Self-executing script
		iife: true,
	},
	module: {
		rules: [
			{
				test: /\.ts$/i,
				use: [
					{
						loader: 'ts-loader',
						options: {
							configFile: 'tsconfig.webpack.json',
						},
					},
				],
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: ['.ts', '.js'],
		fallback: {
			'events': require.resolve('events/'),
			'url': require.resolve('url/'),
		},
	},
	plugins: [
		new HtmlWebpackPlugin({
			inject: false,
			template: 'services/isolatedRenderer/renderer/iframe.ejs',
		}),
	],

	// Increase the maximum size to trigger warnings
	performance: {
		maxAssetSize: 5_000_000, // 5-ish MiB
		maxEntrypointSize: 5_000_000,
	},
});

const bundleJs = async () => {
	const compiler = webpack(webpackOptions('production'));

	return new Promise((resolve, reject) => {
		compiler.run((error, result) => {
			console.log(result.toString());

			if (result.hasErrors()) {
				console.error('Failed:', error);
				reject(error);
			} else {
				resolve();
			}
		});
	});
};

const watchJs = () => {
	const compiler = webpack(webpackOptions('development'));

	compiler.watch({}, (_error, stats) => {
		console.log(stats.toString());
	});
};

exports.bundleJs = bundleJs;
exports.watchBundledJs = watchJs;
