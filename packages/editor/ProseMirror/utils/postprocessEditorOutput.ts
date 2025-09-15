import trimEmptyParagraphs from './trimEmptyParagraphs';

const fixResourceUrls = (container: HTMLElement) => {
	const resources = container.querySelectorAll<HTMLImageElement>('img[data-resource-id]');
	for (const resource of resources) {
		const resourceId = resource.getAttribute('data-resource-id');
		resource.src = `:/${resourceId}`;
	}
};

const removeListItemWrapperParagraphs = (container: HTMLElement) => {
	const listItems = container.querySelectorAll<HTMLLIElement>('li');
	for (const item of listItems) {
		trimEmptyParagraphs(item);

		if (item.children.length === 1) {
			const firstChild = item.children[0];
			if (firstChild.tagName === 'P') {
				firstChild.replaceWith(...firstChild.childNodes);
			}
		}
	}
};

const restoreOriginalLinks = (container: HTMLElement) => {
	// Restore HREFs
	const links = container.querySelectorAll<HTMLAnchorElement>('a[href="#"][data-original-href]');
	for (const link of links) {
		link.href = link.getAttribute('data-original-href');
		link.removeAttribute('data-original-href');
	}
};

const removeTableItemExtraPadding = (container: HTMLElement) => {
	const cells = container.querySelectorAll<HTMLTableCellElement>('th, td');
	for (const cell of cells) {
		// Remove single nonbreaking space padding:
		if (cell.textContent === '\u00A0') {
			cell.textContent = '';
		}
	}
};

const postprocessEditorOutput = (node: Node|DocumentFragment) => {
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
		container.appendChild(node);
		html = container;
	}

	fixResourceUrls(html);
	restoreOriginalLinks(html);
	removeListItemWrapperParagraphs(html);
	removeTableItemExtraPadding(html);

	return html;
};

export default postprocessEditorOutput;
