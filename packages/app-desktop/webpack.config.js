
const path = require('node:path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const rendererDirectory = path.resolve(__dirname, './services/isolatedRenderer/renderer/');

exports.default = {
	entry: path.join(rendererDirectory, 'iframe.ts'),
	mode: 'production',
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
				use: [{ loader: 'ts-loader' }],
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
};
