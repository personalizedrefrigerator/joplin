import MarkupToHtml from "@joplin/renderer/MarkupToHtml";
import { RenderingParams } from "../types";

const render = (params: RenderingParams) => {
	const renderer = new MarkupToHtml(params.options);
	return renderer.render(params.markupLanguage, params.markup, params.theme, params.options);
};

window.addEventListener('message', event => {
	if (event.origin !== parent.origin) {
		console.warn('IFRAME: Ignored event from origin', parent.origin);
		return;
	}

	if (event.data?.message === 'render') {
		// TODO: Validate params
		try {
			parent.postMessage({
				message: 'renderResult',
				data: render(event.data.params),
			});
		} catch(error) {
			parent.postMessage({
				message: 'renderError',
				data: 'Renderer error: ' + error,
			});
		}
	} else {
		console.warn('unknown message, ', event.data?.message);
	}
});