import { RenderResultPluginAsset } from '@joplin/renderer/types';

type PluginAssetRecord = {
	element: HTMLElement;
};
const pluginAssetsAdded_: Map<string, PluginAssetRecord> = new Map();

interface Options {
	removeUnusedPluginAssets: boolean;
	container: HTMLElement;
}

const addPluginAssets = async (assets: RenderResultPluginAsset[], options: Options) => {
	if (!assets) return 0;

	const pluginAssetsContainer = options.container;
	const processedAssetIds = [];

	let addedCount = 0;
	for (const asset of assets) {

		// # and ? can be used in valid paths and shouldn't be treated as the start of a query or fragment
		const encodedPath = asset.path
			.replace(/#/g, '%23')
			.replace(/\?/g, '%3F');

		const assetId = asset.name ? asset.name : encodedPath;

		processedAssetIds.push(assetId);

		if (pluginAssetsAdded_.has(assetId)) continue;

		let element = null;
		if (asset.mime === 'application/javascript') {
			element = document.createElement('script');
			element.src = encodedPath;
		} else if (asset.mime === 'text/css') {
			element = document.createElement('link');
			element.rel = 'stylesheet';
			element.href = encodedPath;
		}
		if (element) {
			pluginAssetsContainer.appendChild(element);
		}

		addedCount++;
		pluginAssetsAdded_.set(assetId, {
			element,
		});
	}

	if (options.removeUnusedPluginAssets) {
		for (const [assetId, asset] of Object.entries(pluginAssetsAdded_)) {
			if (!processedAssetIds.includes(assetId)) {
				try {
					asset.element.remove();
				} catch (error) {
					// Shouldn't happen:
					console.warn('Tried to remove an asset but got an error. On asset:', asset, error);
				}
				pluginAssetsAdded_.delete(assetId);
			}
		}
	}

	return addedCount > 0;
};

export default addPluginAssets;
