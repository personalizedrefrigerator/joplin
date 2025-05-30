import shim from '@joplin/lib/shim';
const FileViewer = require('react-native-file-viewer').default;

const showFile = async (filePath: string) => {
	if (shim.mobilePlatform() === 'web') {
		const url = URL.createObjectURL(await shim.fsDriver().fileAtPath(filePath));
		const w = window.open(url, '_blank');
		w?.addEventListener('close', () => {
			URL.revokeObjectURL(url);
		}, { once: true });
	} else {
		await FileViewer.open(filePath);
	}
};

export default showFile;
