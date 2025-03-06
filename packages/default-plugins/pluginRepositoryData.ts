import { AllRepositoryData, AppType } from './types';

const pluginRepositoryData: AllRepositoryData = {
	'io.github.jackgruber.backup': {
		'cloneUrl': 'https://github.com/JackGruber/joplin-plugin-backup.git',
		'branch': 'master',
		'commit': '5ba57c18ac0f24f20832f012e015a080b138f0c4',
		'appTypes': [AppType.Desktop],
	},
	'io.github.personalizedrefrigerator.js-draw': {
		'cloneUrl': 'https://github.com/personalizedrefrigerator/joplin-plugin-freehand-drawing.git',
		'branch': 'main',
		'commit': '94a78496fac0b3bc7b0f6a896a982480adad3994',
		'appTypes': [AppType.Desktop],
	},
	'com.example.codemirror6-line-numbers': {
		'path': 'packages/app-cli/tests/support/plugins/codemirror6',
		'appTypes': [AppType.Mobile],
	},
};

export default pluginRepositoryData;
