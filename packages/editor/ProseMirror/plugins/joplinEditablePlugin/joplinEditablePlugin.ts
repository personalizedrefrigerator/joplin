import { Plugin } from 'prosemirror-state';
import { Node, NodeSpec } from 'prosemirror-model';
import { EditorView, NodeView } from 'prosemirror-view';
import sanitizeHtml from '../../utils/sanitizeHtml';
import createEditorDialog from './createEditorDialog';
import { getEditorApi } from '../joplinEditorApiPlugin';
import { msleep } from '@joplin/utils/time';
import createTextNode from '../../utils/dom/createTextNode';

// See the fold example for more information about
// writing similar ProseMirror plugins:
// https://prosemirror.net/examples/fold/


const makeJoplinEditableSpec = (inline: boolean): NodeSpec => ({
	group: inline ? 'inline' : 'block',
	inline: inline,
	draggable: true,
	attrs: {
		contentHtml: { default: '', validate: 'string' },
		source: { default: '', validate: 'string' },
		language: { default: '', validate: 'string' },
		openCharacters: { default: '', validate: 'string' },
		closeCharacters: { default: '', validate: 'string' },
	},
	parseDOM: [
		{
			tag: `${inline ? 'span' : 'div'}.joplin-editable`,
			getAttrs: node => {
				const sourceNode = node.querySelector('.joplin-source');
				return {
					contentHtml: node.innerHTML,
					source: sourceNode?.textContent,
					openCharacters: sourceNode?.getAttribute('data-joplin-source-open'),
					closeCharacters: sourceNode?.getAttribute('data-joplin-source-close'),
					language: sourceNode?.getAttribute('data-joplin-language'),
				};
			},
		},
	],
	toDOM: node => {
		const content = document.createElement(inline ? 'span' : 'div');
		content.classList.add('joplin-editable');
		content.innerHTML = sanitizeHtml(node.attrs.contentHtml);

		const sourceNode = content.querySelector('.joplin-source');
		if (sourceNode) {
			sourceNode.textContent = node.attrs.source;
			sourceNode.setAttribute('data-joplin-source-open', node.attrs.openCharacters);
			sourceNode.setAttribute('data-joplin-source-close', node.attrs.closeCharacters);
		}

		return content;
	},
});

export const nodeSpecs = {
	joplinEditableInline: makeJoplinEditableSpec(true),
	joplinEditableBlock: makeJoplinEditableSpec(false),
};

type GetPosition = ()=> number;

class EditableSourceBlockView implements NodeView {
	public readonly dom: HTMLElement;
	public constructor(private node: Node, inline: boolean, private view: EditorView, private getPosition: GetPosition) {
		if ((node.attrs.contentHtml ?? undefined) === undefined) {
			throw new Error(`Unable to create a SourceBlockView for a node lacking contentHtml. Node: ${node}.`);
		}

		this.dom = document.createElement(inline ? 'span' : 'div');
		this.dom.classList.add('joplin-editable');
		this.updateContent_(node.attrs.contentHtml);
	}

	private showEditDialog_() {
		const { localize: _ } = getEditorApi(this.view.state);

		let saveCounter = 0;
		createEditorDialog({
			doneLabel: _('Done'),
			block: {
				content: this.node.attrs.source,
				start: this.node.attrs.openCharacters,
				end: this.node.attrs.closeCharacters,
			},
			onSave: async (block) => {
				this.view.dispatch(
					this.view.state.tr.setNodeAttribute(
						this.getPosition(), 'source', block.content,
					).setNodeAttribute(
						this.getPosition(), 'openCharacters', block.start,
					).setNodeAttribute(
						this.getPosition(), 'closeCharacters', block.end,
					),
				);

				saveCounter ++;
				const initialSaveCounter = saveCounter;
				const cancelled = () => saveCounter !== initialSaveCounter;

				// Debounce rendering
				await msleep(400);
				if (cancelled()) return;

				const rendered = await getEditorApi(this.view.state).renderer.renderMarkupToHtml(
					`${block.start}${block.content}${block.end}`,
					{ forceMarkdown: true, isFullPageRender: false },
				);
				if (cancelled()) return;

				this.view.dispatch(
					this.view.state.tr.setNodeAttribute(
						this.getPosition(), 'contentHtml', rendered.html,
					),
				);
			},
		});
	}

	private updateContent_(unsafeHtml: string) {
		const setDomContentSafe = (html: string) => {
			this.dom.innerHTML = sanitizeHtml(html);
		};

		const postProcessDom = () => {
			const replaceChildMatching = (selector: string) => {
				const toReplace = [...this.dom.children].find(
					child => child.matches(selector),
				);
				toReplace?.replaceWith(...toReplace.childNodes);
			};
			// If the original HTML is from .renderToMarkup, it may have a <div> wrapper:
			replaceChildMatching('#rendered-md');

			if (this.dom.children.length === 1 && this.node.isInline) {
				replaceChildMatching('p, div');
			}

			// Remove the 'joplin-editable' container if it's the only thing in the content
			// (since this.dom is itself a joplin-editable)
			if (this.dom.children.length === 1) {
				replaceChildMatching('.joplin-editable');
			}
		};

		const addEditButton = () => {
			const editButton = document.createElement('button');
			editButton.classList.add('edit');

			const { localize: _ } = getEditorApi(this.view.state);

			editButton.appendChild(createTextNode(_('Edit')));
			editButton.onclick = (event) => {
				this.showEditDialog_();
				event.preventDefault();
			};
			this.dom.appendChild(editButton);
		};

		setDomContentSafe(unsafeHtml);
		postProcessDom();
		addEditButton();
	}

	public selectNode() {
		this.dom.classList.add('-selected');
	}

	public deselectNode() {
		this.dom.classList.remove('-selected');
	}

	public stopEvent(event: Event) {
		// Allow using the keyboard to activate the "edit" button:
		return event.target === this.dom.querySelector('button.edit');
	}

	public update(node: Node) {
		if (node.type.spec !== this.node.type.spec) {
			return false;
		}

		this.node = node;
		this.updateContent_(node.attrs.contentHtml);

		return true;
	}
}

const joplinEditablePlugin = new Plugin({
	props: {
		nodeViews: {
			joplinEditableInline: (node, view, getPos) => new EditableSourceBlockView(node, true, view, getPos),
			joplinEditableBlock: (node, view, getPos) => new EditableSourceBlockView(node, false, view, getPos),
		},
	},
});

export default joplinEditablePlugin;
