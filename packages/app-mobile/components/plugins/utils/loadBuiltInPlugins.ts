import PluginService, { PluginSettings } from '@joplin/lib/services/plugins/PluginService';
import shim from '@joplin/lib/shim';
import Logger from '@joplin/utils/Logger';
import { Asset } from 'expo-asset';
import { Platform } from 'react-native';
import FsDriverWeb from '../../../utils/fs-driver/fs-driver-rn.web';
import uuid from '@joplin/lib/uuid';

const logger = Logger.create('loadBuiltInPlugins');

const defaultPlugins: Record<string, string|number> = {
	'com.example.codemirror6-line-numbers': require('../../../default-plugins/com.example.codemirror6-line-numbers.jpl'),
};

type CancelEvent = { cancelled: boolean };
const loadBuiltInPlugins = async (pluginSettings: PluginSettings, cancelEvent: CancelEvent) => {
	const pluginPaths: string[] = [];

	for (const pluginId in defaultPlugins) {
		logger.info(`Copying plugin with ID ${pluginId}`);

		const pluginAsset = Asset.fromModule(defaultPlugins[pluginId]);

		// Note: downloadAsync is documented to only download the file if an up-to-date
		// local copy is not already present.
		await pluginAsset.downloadAsync();

		let assetFilePath;
		if (Platform.OS === 'web') {
			const downloadedAsset = await shim.fetch(pluginAsset.uri);
			const blob = await downloadedAsset.blob();
			const fileName = `${uuid.create()}.jpl`;
			const file = new File([blob], fileName);

			assetFilePath = `/tmp/${fileName}`;
			await (shim.fsDriver() as FsDriverWeb).createReadOnlyVirtualFile(assetFilePath, file);
		} else {
			assetFilePath = pluginAsset.localUri.replace(/^file:[/][/]/, '');
		}
		pluginPaths.push(assetFilePath);

		if (cancelEvent.cancelled) {
			return;
		}
	}

	if (pluginPaths.length > 0) {
		await PluginService.instance().loadAndRunPlugins(pluginPaths, pluginSettings, { builtIn: true, devMode: false });
	}
};

export default loadBuiltInPlugins;
