module.exports = {
	'overrides': [
		{
			files: ['**/*.tsx', '**/*.js', '**/*.ts'],
			rules: {
				'no-restricted-globals': ['error',
					...['alert', 'confirm', 'prompt'].map(alertLikeFunction => ({
						'name': alertLikeFunction,
						'message': 'Avoid using alert()/confirm()/prompt() in the desktop app. Doing so can break keyboard input on certain systems. See https://github.com/electron/electron/issues/19977.',
					})),
				],
			},
		},
	],
};
