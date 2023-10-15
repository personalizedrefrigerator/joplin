import MarkupToHtml from '@joplin/renderer/MarkupToHtml';
import { MainToSandboxMessage, RenderMessage, SandboxMessageType, SandboxToMainMessage } from '../types';
import { internalUrl, isResourceUrl, isSupportedImageMimeType, pathToId, resourceFilename, resourceFriendlySafeFilename, resourceFullPath, urlToId } from '@joplin/lib/models/utils/resourceUtils';
import { ResourceEntity } from '@joplin/lib/services/database/types';
import { ExtraRendererRule } from '@joplin/renderer/MdToHtml';
import loadContentScripts from './loadContentScripts';

const main = () => {
	// The parent window has origin `file://` because it's an
	// electron app.
	const parentOrigin = 'file://';

	const postMessageToParent = (message: SandboxToMainMessage) => {
		// It seems that we need to use '*' here because of sandboxing
		// restrictions.
		parent.postMessage(message, '*');
	};

	let resourceBaseDir = '';
	const ResourceModel = {
		filename: resourceFilename,
		friendlySafeFilename: resourceFriendlySafeFilename,
		fullPath: (resource: ResourceEntity, encryptedBlob?: boolean) => {
			return resourceFullPath(resource, resourceBaseDir, encryptedBlob);
		},
		internalUrl,
		pathToId,
		isResourceUrl,
		isSupportedImageMimeType,
		urlToId,
	};

	let wrappedMarkupToHtml: MarkupToHtml|null = null;

	const render = async (message: RenderMessage) => {
		const options = {
			...message.options,
			ResourceModel,
		};
		const renderer = wrappedMarkupToHtml;
		try {
			const result = await renderer.render(
				message.markupLanguage,
				message.markup,
				options.theme,
				options,
			);

			postMessageToParent({
				kind: SandboxMessageType.RenderResult,
				responseId: message.responseId,
				result,
			});
		} catch (error) {
			postMessageToParent({
				kind: SandboxMessageType.Error,
				responseId: message.responseId,
				errorMessage: `${error}`,
				unusable: true,
			});
			throw error;
		}
	};

	window.addEventListener('message', async event => {
		if (event.origin !== parentOrigin) {
			console.warn('IFRAME: Ignored event from origin: ', event.origin);
			return;
		}

		const message = event.data as MainToSandboxMessage;

		if (message.kind === SandboxMessageType.SetOptions) {
			resourceBaseDir = message.options.resourceBaseUrl;

			const errors = [];
			let unusable = false;

			const extraRendererRules: ExtraRendererRule[] = await loadContentScripts(message.plugins ?? [], error => errors.push(error));

			try {
				wrappedMarkupToHtml = new MarkupToHtml({
					...message.options,
					extraRendererRules,
					ResourceModel,
				});
			} catch (error) {
				errors.push(error);
				unusable = true;
			}

			if (errors.length > 0) {
				// Log the error messages for easier debugging
				console.error('Renderer setup errors', errors);

				// Notify the parent
				postMessageToParent({
					kind: SandboxMessageType.Error,
					responseId: message.responseId,
					errorMessage: `${errors.map(error => `${error}`).join(', ')}`,
					unusable,
				});

				if (unusable) {
					throw errors[errors.length - 1];
				}
			}
			postMessageToParent({
				kind: SandboxMessageType.OptionsLoaded,
				responseId: message.responseId,
			});

			return;
		}

		if (!wrappedMarkupToHtml) {
			throw new Error(`MarkupToHtml not yet initialized. message: ${JSON.stringify(message)}`);
		}

		if (message.kind === SandboxMessageType.ClearCache) {
			wrappedMarkupToHtml.clearCache(message.language);
		} else if (message.kind === SandboxMessageType.Render) {
			void render(message);
		} else {
			console.warn('unknown message:', event.data);
		}
	});

	postMessageToParent({
		kind: SandboxMessageType.SandboxLoaded,

		// Not a response
		responseId: undefined,
	});
};

main();
