import MarkupToHtml, { MarkupLanguage } from '@joplin/renderer/MarkupToHtml';
import { internalUrl, isResourceUrl, isSupportedImageMimeType, pathToId, resourceFilename, resourceFriendlySafeFilename, resourceFullPath, urlToId } from '@joplin/lib/models/utils/resourceUtils';
import { ResourceEntity } from '@joplin/lib/services/database/types';
import { ExtraRendererRule } from '@joplin/renderer/MdToHtml';
import loadContentScripts from './loadContentScripts';
import WindowMessenger from '../messenger/WindowMessenger';
import { GetAssetsProps, MainApi, RenderProps, RendererApi, RendererHandle } from '../types';
import { RenderResult, RenderResultPluginAsset } from '@joplin/renderer/types';

interface MarkupToHtmlWrapper {
	render(props: RenderProps): Promise<RenderResult>;
	clearCache(language: MarkupLanguage): void;
	getAssets(props: GetAssetsProps): Promise<RenderResultPluginAsset[]>;
}

const makeResourceModel = (getResourceBaseDir: ()=> string) => {
	const resourceModel = {
		filename: resourceFilename,
		friendlySafeFilename: resourceFriendlySafeFilename,
		fullPath: (resource: ResourceEntity, encryptedBlob?: boolean) => {
			return resourceFullPath(resource, getResourceBaseDir(), encryptedBlob);
		},
		internalUrl,
		pathToId,
		isResourceUrl,
		isSupportedImageMimeType,
		urlToId,
	};

	return resourceModel;
};

const wrappedRenderers: MarkupToHtmlWrapper[] = [];

const assertRendererExists = (handle: RendererHandle) => {
	if (handle >= wrappedRenderers.length) {
		throw new Error(`Renderer ${handle} has not been created yet`);
	}

	if (!wrappedRenderers[handle]) {
		throw new Error(`Renderer ${handle} has already been destroyed`);
	}
};

let remoteApi: MainApi;
const rendererApi: RendererApi = {
	async createWithOptions(options, plugins) {
		const resourceModel = makeResourceModel(() => options.resourceBaseUrl);
		const extraRendererRules: ExtraRendererRule[] = await loadContentScripts(
			plugins ?? [],
			error => remoteApi.logError(`Error loading content scipts: ${error}`),
		);

		const renderer = new MarkupToHtml({
			...options,
			extraRendererRules,
			ResourceModel: resourceModel,
			fsDriver: {
				cacheCssToFile: remoteApi.cacheCssToFile,
			},
		});

		const wrapper: MarkupToHtmlWrapper = {
			render: (props: RenderProps) => {
				const options = {
					...props.options,
					ResourceModel: resourceModel,
				};

				return renderer.render(
					props.markupLanguage,
					props.markup,
					props.options.theme,
					options,
				);
			},
			clearCache: (language: MarkupLanguage) => {
				return renderer.clearCache(language);
			},
			getAssets: (props: GetAssetsProps) => {
				return renderer.allAssets(props.markupLanguage, props.theme, props.noteStyleOptions);
			},
		};

		const wrapperId = wrappedRenderers.length;
		wrappedRenderers.push(wrapper);
		return wrapperId;
	},

	async render(rendererId: RendererHandle, props: RenderProps) {
		assertRendererExists(rendererId);
		return wrappedRenderers[rendererId].render(props);
	},

	async clearCache(rendererId: RendererHandle, language: MarkupLanguage) {
		assertRendererExists(rendererId);
		return wrappedRenderers[rendererId].clearCache(language);
	},

	getAssets(rendererId: RendererHandle, props: GetAssetsProps) {
		assertRendererExists(rendererId);

		return wrappedRenderers[rendererId].getAssets(props);
	},

	async destroy(rendererId: RendererHandle) {
		delete wrappedRenderers[rendererId];
	},
};

const main = () => {
	const messenger = new WindowMessenger<RendererApi, MainApi>(window.parent, rendererApi);
	remoteApi = messenger.remoteApi;
};

main();
