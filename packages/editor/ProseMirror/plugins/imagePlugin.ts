import { Plugin } from 'prosemirror-state';
import { AttributeSpec, Node, NodeSpec } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';
import SelectableNodeView, { GetPosition } from '../utils/SelectableNodeView';
import { getEditorApi } from './joplinEditorApiPlugin';
import showModal from '../utils/dom/showModal';
import createTextArea from '../utils/dom/createTextArea';

// See the fold example for more information about
// writing similar ProseMirror plugins:
// https://prosemirror.net/examples/fold/

type NodeAttrs = Readonly<{
	// Placeholder attributes (e.g. if the src is not
	// yet valid).
	isPlaceholder: boolean;
	placeholderSrc: string;
	placeholderAlt: string;
	notDownloaded: boolean;
	isImage: boolean;

	resourceId: string;
	src: string;
	fromMd: boolean;
	alt: string;
	title: string;
}>;

const attrsSpec = {
	isPlaceholder: { default: '', validate: 'boolean' },
	placeholderSrc: { default: '', validate: 'string' },
	placeholderAlt: { default: '', validate: 'string' },
	notDownloaded: { validate: 'boolean' },
	isImage: { validate: 'boolean' },

	resourceId: { default: null as string|null, validate: 'string|null' },
	src: { default: '', validate: 'string' },
	fromMd: { default: false, validate: 'boolean' },
	alt: { default: '', validate: 'string' },
	title: { default: '', validate: 'string' },
} satisfies Record<keyof NodeAttrs, AttributeSpec>;

const imageSpec: NodeSpec = {
	group: 'inline',
	inline: true,
	attrs: attrsSpec,
	draggable: true,
	parseDOM: [
		{
			// Images
			tag: 'img[src]',
			getAttrs: (node): NodeAttrs => ({
				src: node.getAttribute('src'),
				alt: node.getAttribute('alt'),
				title: node.getAttribute('title'),
				fromMd: node.hasAttribute('data-from-md'),
				resourceId: node.getAttribute('data-resource-id') || null,

				isPlaceholder: false,
				placeholderSrc: '',
				placeholderAlt: '',
				notDownloaded: false,
				isImage: true,
			}),
		},
		{
			// Placeholders
			tag: 'span[data-resource-id].not-loaded-resource',
			getAttrs: (node): NodeAttrs => {
				return {
					isPlaceholder: true,
					resourceId: node.getAttribute('data-resource-id'),
					placeholderSrc: node.querySelector('img')?.src,
					src: '',
					placeholderAlt: node.querySelector('img')?.alt,
					fromMd: false,
					alt: node.getAttribute('data-original-alt'),
					title: node.getAttribute('data-original-title'),
					isImage: node.classList.contains('not-loaded-image-resource'),
					notDownloaded: node.classList.contains('resource-status-notDownloaded'),
				};
			},
		},
	],
	toDOM: (node) => {
		const attrs = node.attrs as NodeAttrs;
		return attrs.isPlaceholder ? [
			'span',
			{
				'data-resource-id': attrs.resourceId,
				'data-original-alt': attrs.alt,
				'data-original-title': attrs.title,
				class: [
					'not-loaded-resource',
					attrs.isImage ? 'not-loaded-image-resource' : null,
					attrs.notDownloaded ? 'resource-status-notDownloaded' : null,
				].filter(item => !!item).join(' '),
			},
			['img', { src: attrs.placeholderSrc, alt: attrs.placeholderAlt }],
		] : [
			'img',
			{
				...(attrs.fromMd ? {
					'data-from-md': true,
				} : {}),
				...(attrs.resourceId ? {
					'data-resource-id': attrs.resourceId,
				} : {}),
				src: attrs.src,
				alt: attrs.alt,
				title: attrs.title,
			},
		];
	},
};

export const nodeSpecs = {
	image: imageSpec,
};

class ImageView extends SelectableNodeView {
	public constructor(node: Node, view: EditorView, getPosition: GetPosition) {
		super(true);
		this.dom.classList.add('joplin-image-view');

		this.dom.appendChild(this.createDom_(node));
		const { localize: _ } = getEditorApi(view.state);

		this.addActionButton(_('ALT'), () => {
			const position = getPosition();
			const node = view.state.doc.nodeAt(position);
			const attrs = node.attrs as NodeAttrs;

			const content = document.createElement('div');
			content.classList.add('alt-text-editor');
			const input = createTextArea({
				label: _('A brief description of the image:'),
				initialContent: attrs.alt,
				onChange: (newContent) => {
					view.dispatch(
						// TODO: Handle the case where the node moves during editing.
						view.state.tr.setNodeAttribute(position, 'alt', newContent.replace(/[\n]+/g, '\n')),
					);
				},
			});
			content.appendChild(input.label);
			content.appendChild(input.textArea);

			showModal({
				content,
				doneLabel: _('Done'),
				onDismiss: ()=>{},
			});
		});
	}

	private createDom_(node: Node) {
		const attrs = node.attrs as NodeAttrs;

		const createDom = (imageSrc: string, imageAlt: string, loaded: boolean) => {
			const image = document.createElement('img');
			image.src = imageSrc;
			image.alt = imageAlt;

			let dom;
			if (!loaded) {
				dom = document.createElement('span');
				dom.classList.add('not-loaded-resource');
				dom.appendChild(image);
			} else {
				dom = image;
				dom.classList.add('late-loaded-resource');
			}
			// For testing
			dom.setAttribute('data-resource-id', attrs.resourceId);
			return dom;
		};

		let imageSrc = attrs.placeholderSrc;
		let imageAlt = attrs.placeholderAlt;
		let loaded = false;

		if (!attrs.isPlaceholder) {
			loaded = true;
			imageSrc = attrs.src;
			imageAlt = attrs.alt;
		}

		return createDom(imageSrc, imageAlt, loaded);
	}
}

export const onResourceDownloaded = (view: EditorView, resourceId: string, newSrc: string) => {
	let tr = view.state.tr;
	view.state.doc.descendants((node, pos) => {
		if (node.type.name === 'image') {
			const attrs = node.attrs as NodeAttrs;
			const itemId = attrs.resourceId;

			if (itemId === resourceId && attrs.isPlaceholder) {
				tr = tr.setNodeAttribute(pos, 'isPlaceholder', false)
					.setNodeAttribute(pos, 'notDownloaded', false)
					.setNodeAttribute(pos, 'src', newSrc)
					.setMeta('addToHistory', false);
			}
		}
	});
	view.dispatch(tr);
};

const imagePlugin = new Plugin({
	props: {
		nodeViews: {
			image: (node, view, getPosition) => {
				return new ImageView(node, view, getPosition);
			},
		},
	},
});

export default imagePlugin;
