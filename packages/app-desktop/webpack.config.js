
const path = require('node:path');

const rendererDirectory = path.resolve(__dirname, './services/isolatedRenderer/renderer/');

exports.default = {
	entry: path.join(rendererDirectory, 'iframe.ts'),
	mode: 'development',
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
		fallback: { 'events': require.resolve('events/') },
	},
};
