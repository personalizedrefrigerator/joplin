import { PluginStates } from "@joplin/lib/services/plugins/reducer";
import uuid from "@joplin/lib/uuid";
import { RenderResult } from "@joplin/renderer/MarkupToHtml";
import { join } from "path";
import { RenderingParams } from "./types";

export default class IsolatedRendererControl {
	private iframe: HTMLIFrameElement;
	public constructor(parentDocument: Document) {
		this.iframe = parentDocument.createElement('iframe');
		this.iframe.src = join(__dirname, 'renderer', 'iframe.html');
		this.iframe.setAttribute('sandbox', 'allow-scripts');
	}

	public setPlugins(plugins: PluginStates) {
		this.iframe.contentWindow.postMessage({
			message: 'setPlugins',
			plugins,
		}, this.iframe.contentWindow.origin);
	}

	public render(params: RenderingParams) {
		return new Promise<RenderResult>((resolve, reject) => {
			// A unique ID that allows us to identify this render request
			const senderId = uuid.create();

			const messageListener = (event: MessageEvent) => {
				// The message needs to be in response to the render message we sent
				if (event.data?.respondTo !== senderId) {
					return;
				}

				if (event.origin !== this.iframe.contentWindow.origin) {
					console.log('Ignored event from origin', this.iframe.contentWindow.origin);
					return;
				}

				const isResult = event.data.message === 'renderResult';
				const isError = event.data.message === 'renderError';

				if (isResult || isError) {
					window.removeEventListener('message', messageListener);

					console.log('TODO: Validate data')
	
					if (isResult) {
						// assertIsString(data.html)
						// assertIsArrayOfType(data.pluginAssets, item => {
						//	assertIsString(item.name)
						// })
						// assertIsArrayOfType(data.cssStrings, 'string')
						//
						// TODO: Also only copy properties we've verified.
						resolve(event.data.data);
					} else {
						reject(event.data.data);
					}
				}
			};

			window.addEventListener('message', messageListener);

			this.iframe.contentWindow.postMessage({
				message: 'render',
				params,
				senderId,
			}, this.iframe.contentWindow.origin);
		});
	}
}