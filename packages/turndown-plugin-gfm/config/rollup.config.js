export default function(config) {
	return {
		input: 'src/gfm.js',
		output: {
			name: 'turndownPluginGfm',
			...config.output,
		},
	};
}
