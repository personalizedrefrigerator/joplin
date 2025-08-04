import { Plugin } from 'prosemirror-state';
import { Node, NodeSpec } from 'prosemirror-model';
import { EditorView, NodeView } from 'prosemirror-view';
import jumpToHash from '../utils/jumpToHash';

interface TableOfContentsLink {
	href: string;
	text: string;
	depthChange: number;
}

const linkListFromElement = (element: HTMLElement) => {
	const listItems = element.querySelectorAll('li');

	const result: TableOfContentsLink[] = [];
	const seenParents: HTMLElement[] = [];
	let lastParent = null;
	for (const item of listItems) {
		const isFirst = lastParent === null;
		const isFirstOccurrence = !seenParents.includes(item.parentElement);
		const isDepthIncrease = !isFirst && isFirstOccurrence;
		let depthDecreaseAmount = 0;
		if (!isFirst && !isDepthIncrease) {
			depthDecreaseAmount = seenParents.length - (seenParents.indexOf(item.parentElement) + 1);
		}
		if (isFirstOccurrence) {
			seenParents.push(item.parentElement);
		}
		lastParent = item.parentElement;

		const anchors = item.getElementsByTagName('A');
		if (anchors.length === 0) continue;
		const anchor = anchors[0];

		result.push({
			href: anchor.getAttribute('href'),
			text: anchor.textContent,
			depthChange: isDepthIncrease ? 1 : depthDecreaseAmount,
		});
	}
	return result;
};

type OnFollowLink = (link: TableOfContentsLink)=> void;
const buildTableOfContents = (links: TableOfContentsLink[], onFollowLink: null|OnFollowLink) => {
	const content = document.createElement('nav');
	content.classList.add('table-of-contents', 'jop-dynamic-table-of-contents');
	content.contentEditable = 'false';

	// Add a placeholder to allow the table of contents to be converted back to Markdown:
	if (links.length === 0) {
		content.textContent = '[toc]';
	}

	const buildLink = (linkData: TableOfContentsLink) => {
		const { href, text } = linkData;
		const linkElement = document.createElement('a');
		linkElement.textContent = text;

		if (href.startsWith('#')) {
			linkElement.href = href;
		}

		if (onFollowLink) {
			linkElement.onclick = () => {
				onFollowLink(linkData);
			};
		}

		return linkElement;
	};

	const list = document.createElement('ul');
	const parents: HTMLElement[] = [];
	let lastListItem: HTMLElement|null = null;

	for (const link of links) {
		const listItem = document.createElement('li');
		listItem.appendChild(buildLink(link));

		if (link.depthChange < 0) {
			for (let i = 0; i < Math.abs(link.depthChange) && parents.length > 0; i++) {
				parents.pop();
			}
		} else if (link.depthChange === 1 && lastListItem) {
			const subList = document.createElement('ul');
			lastListItem.appendChild(subList);
			parents.push(subList);
		}

		const parent = parents[parents.length - 1] ?? list;
		parent.appendChild(listItem);
		lastListItem = listItem;
	}
	content.appendChild(list);

	return content;
};

export const nodeSpecs = {
	tableOfContents: {
		group: 'block',
		inline: false,
		draggable: true,

		attrs: {
			links: {
				default: [] as TableOfContentsLink[],
				validate: (value) => {
					if (!Array.isArray(value)) {
						throw new Error('value must be an array');
					}

					for (const item of value) {
						if (typeof item.href !== 'string') {
							throw new Error('link must have a string href');
						}
						if (typeof item.text !== 'string') {
							throw new Error('Each link must have string content');
						}
						if (typeof item.depthChange !== 'number') {
							throw new Error('Each link must have a depthChange property of type "number"');
						}
					}
				},
			},
		},
		parseDOM: [
			{
				tag: 'nav.table-of-contents',
				getAttrs: (node) => {
					return { links: linkListFromElement(node) };
				},
			},
		],
		toDOM: node => {
			return buildTableOfContents(node.attrs.links, null);
		},
	},
} satisfies Record<string, NodeSpec>;

class TableOfContentsView implements NodeView {
	public readonly dom: HTMLElement;
	public constructor(node: Node, view: EditorView) {
		this.dom = buildTableOfContents(node.attrs.links, (link) => {
			jumpToHash(link.href)(view.state, tr => view.dispatch(tr), view);
		});
	}
}

const joplinEditablePlugin = new Plugin({
	props: {
		nodeViews: {
			tableOfContents: (node, view) => new TableOfContentsView(node, view),
		},
	},
});

export default joplinEditablePlugin;
