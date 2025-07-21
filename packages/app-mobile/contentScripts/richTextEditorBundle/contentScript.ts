import { createEditor } from '@joplin/editor/ProseMirror';
import { EditorProcessApi, EditorProps, MainProcessApi } from './types';
import WebViewToRNMessenger from '../../utils/ipc/WebViewToRNMessenger';
import { MarkupLanguage } from '@joplin/renderer';
import '@joplin/editor/ProseMirror/styles';
import HtmlToMd from '@joplin/lib/HtmlToMd';

const postprocessHtml = (html: HTMLElement) => {
	html = html.cloneNode(true) as HTMLElement;

	// Fix resource URLs
	const resources = html.querySelectorAll<HTMLImageElement>('img[data-resource-id]');
	for (const resource of resources) {
		const resourceId = resource.getAttribute('data-resource-id');

		// By default, if `src` is specified, the browser will try to load the image, even if it isn't added
		// to the DOM.
		// Since :/resourceId isn't a valid image URI, this results in a large number of warnings. As a workaround,
		// use `data-src` to store the `src`. The `src` will be restored when saving.
		resource.setAttribute('data-src', `:/${resourceId}`);
		resource.src = '';
	}

	// Preserve repeated spaces -- ProseMirror visually preserves spaces with "white-space: break-spaces".
	const replaceRepeatedSpace = (node: Node) => {
		if (node.nodeType === Node.TEXT_NODE) {
			node.textContent = node.textContent.replace(/ {2}/g, ' &nbsp;');
		}

		for (const child of node.childNodes) {
			replaceRepeatedSpace(child);
		}
	};
	replaceRepeatedSpace(html);

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


const htmlToMd = new HtmlToMd();
const htmlToMarkdown = (html: HTMLElement): string => {
	html = postprocessHtml(html);

	return htmlToMd.parse(html);
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

		onPasteFile: () => {
			throw new Error('Not implemented: onPasteFile');
		},
		onLogMessage: (message: string) => {
			void messenger.remoteApi.logMessage(message);
		},
		onEvent: (event) => {
			void messenger.remoteApi.onEditorEvent(event);
		},
	}, async (markup) => {
		return await messenger.remoteApi.onRender({
			markup,
			language: MarkupLanguage.Markdown,
		}, {
			pluginAssetContainerSelector: `#${assetContainer.id}`,
			splitted: true,
			mapsToLine: true,
		});
	}, htmlToMarkdown);

	messenger.setLocalInterface({
		editor,
	});

	return editor;
};

export { default as setUpLogger } from '../utils/setUpLogger';

