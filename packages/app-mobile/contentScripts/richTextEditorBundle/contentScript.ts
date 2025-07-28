import '../utils/polyfills';
import { createEditor } from '@joplin/editor/ProseMirror';
import { EditorProcessApi, EditorProps, MainProcessApi } from './types';
import WebViewToRNMessenger from '../../utils/ipc/WebViewToRNMessenger';
import { MarkupLanguage } from '@joplin/renderer';
import '@joplin/editor/ProseMirror/styles';
import HtmlToMd from '@joplin/lib/HtmlToMd';
import readFileToBase64 from '../utils/readFileToBase64';
import { EditorLanguageType } from '@joplin/editor/types';

const postprocessHtml = (html: HTMLElement) => {
	// Fix resource URLs
	const resources = html.querySelectorAll<HTMLImageElement>('img[data-resource-id]');
	for (const resource of resources) {
		const resourceId = resource.getAttribute('data-resource-id');
		resource.src = `:/${resourceId}`;
	}

	// Re-add newlines to data-joplin-source-* that were removed
	// by ProseMirror.
	// TODO: Try to find a better solution
	const sourceBlocks = html.querySelectorAll<HTMLPreElement>(
		'pre[data-joplin-source-open][data-joplin-source-close].joplin-source',
	);
	for (const sourceBlock of sourceBlocks) {
		const isBlock = sourceBlock.parentElement.tagName !== 'SPAN';
		if (isBlock) {
			const originalOpen = sourceBlock.getAttribute('data-joplin-source-open');
			const originalClose = sourceBlock.getAttribute('data-joplin-source-close');
			sourceBlock.setAttribute('data-joplin-source-open', `${originalOpen}\n`);
			sourceBlock.setAttribute('data-joplin-source-close', `\n${originalClose}`);
		}
	}

	return html;
};

const wrapHtmlForMarkdownConversion = (html: HTMLElement) => {
	// Add a container element -- when converting to HTML, Turndown
	// sometimes doesn't process the toplevel element in the same way
	// as other elements (e.g. in the case of Joplin source blocks).
	const wrapper = html.ownerDocument.createElement('div');
	wrapper.appendChild(html.cloneNode(true));
	return wrapper;
};


const htmlToMd = new HtmlToMd();
const htmlToMarkdown = (html: HTMLElement): string => {
	html = postprocessHtml(html);

	return htmlToMd.parse(html, { preserveColorStyles: true });
};

export const initialize = async ({
	settings,
	initialText,
	initialNoteId,
	parentElementClassName,
}: EditorProps) => {
	const messenger = new WebViewToRNMessenger<EditorProcessApi, MainProcessApi>('rich-text-editor', null);
	const parentElement = document.getElementsByClassName(parentElementClassName)[0];
	if (!parentElement) throw new Error('Parent element not found');
	if (!(parentElement instanceof HTMLElement)) {
		throw new Error('Parent node is not an element.');
	}

	const assetContainer = document.createElement('div');
	assetContainer.id = 'joplin-container-pluginAssetsContainer';
	document.body.appendChild(assetContainer);

	const editor = await createEditor(parentElement, {
		settings,
		initialText,
		initialNoteId,

		onPasteFile: async (data) => {
			const base64 = await readFileToBase64(data);
			await messenger.remoteApi.onPasteFile(data.type, base64);
		},
		onLogMessage: (message: string) => {
			void messenger.remoteApi.logMessage(message);
		},
		onEvent: (event) => {
			void messenger.remoteApi.onEditorEvent(event);
		},
	}, {
		renderMarkupToHtml: async (markup) => {
			return await messenger.remoteApi.onRender({
				markup,
				language: settings.language === EditorLanguageType.Html ? MarkupLanguage.Html : MarkupLanguage.Markdown,
			}, {
				pluginAssetContainerSelector: `#${assetContainer.id}`,
				splitted: true,
				mapsToLine: true,
			});
		},
		renderHtmlToMarkup: (node) => {
			// By default, if `src` is specified on an image, the browser will try to load the image, even if it isn't added
			// to the DOM. (A similar problem is described here: https://stackoverflow.com/q/62019538).
			// Since :/resourceId isn't a valid image URI, this results in a large number of warnings. As a workaround,
			// move the element to a temporary document before processing:
			const dom = document.implementation.createHTMLDocument();
			node = dom.importNode(node, true);

			let html: HTMLElement;
			if ((node instanceof HTMLElement)) {
				html = node;
			} else {
				const container = document.createElement('div');
				container.appendChild(html);
				html = container;
			}

			if (settings.language === EditorLanguageType.Markdown) {
				return htmlToMarkdown(wrapHtmlForMarkdownConversion(html));
			} else {
				return postprocessHtml(html).outerHTML;
			}
		},
	});

	messenger.setLocalInterface({
		editor,
	});

	return editor;
};

export { default as setUpLogger } from '../utils/setUpLogger';

