import MarkupToHtml from '@joplin/renderer/MarkupToHtml';
import Resource from '@joplin/lib/models/Resource';
import { MainToSandboxMessage, RenderMessage, SandboxMessageType, SandboxToMainMessage } from '../types';

// TODO: Don't include Resource -- it's huge
const ResourceModel = Resource;

const main = () => {
	// The parent window has origin `file://` because it's an
	// electron app.
	const parentOrigin = 'file://';

	const postMessageToParent = (message: SandboxToMainMessage) => {
		// It seems that we need to use '*' here because of sandboxing
		// restrictions.
		parent.postMessage(message, '*');
	};


	let wrappedMarkupToHtml: MarkupToHtml|null = null;

	const render = async (message: RenderMessage) => {
		const options = {
			...message.options,
			ResourceModel,
		};
		const renderer = new MarkupToHtml(options);
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
			});
			throw error;
		}
	};

	window.addEventListener('message', event => {
		if (event.origin !== parentOrigin) {
			console.warn('IFRAME: Ignored event from origin', event.origin);
			return;
		}

		const message = event.data as MainToSandboxMessage;

		if (message.kind === SandboxMessageType.SetOptions) {
			wrappedMarkupToHtml = new MarkupToHtml({
				...message.options,
				ResourceModel,
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
		}



		if (event.data?.message === 'render') {
			// TODO: Validate params
			try {
				parent.postMessage({
					message: 'renderResult',
					data: render(event.data.params),
				});
			} catch (error) {
				parent.postMessage({
					message: 'renderError',
					data: `Renderer error: ${error}`,
				});
			}
		} else {
			console.warn('unknown message, ', event.data?.message);
		}
	});

	postMessageToParent({
		kind: SandboxMessageType.SandboxLoaded,

		// Not a response
		responseId: undefined,
	});
};

main();
