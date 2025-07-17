import { Plugin } from 'prosemirror-state';
import { Node, NodeSpec, Schema } from 'prosemirror-model';
import { EditorView, NodeView } from 'prosemirror-view';
import trimEmptyParagraphs from '../utils/trimEmptyParagraphs';

// See the fold example for more information about
// writing similar ProseMirror plugins:
// https://prosemirror.net/examples/fold/


export const nodeSpecs = {
	taskList: {
		content: 'taskListItem+',
		group: 'block',
		parseDOM: [{ tag: 'ul[data-is-checklist]' }],
		toDOM: () => ['ul', { class: 'task-list', 'data-is-checklist': '1' }, 0],
	},
	taskListItem: {
		content: 'taskListLabel block*',
		defining: true,

		parseDOM: [
			{
				tag: 'li.md-checkbox',
				contentElement(node) {
					const result = node.cloneNode(true) as HTMLElement;
					// Empty paragraphs can cause rendering issues
					trimEmptyParagraphs(result);

					const firstChild = () => node.children[0];
					if (firstChild()?.matches('div.checkbox-wrapper')) {
						firstChild().replaceWith(...firstChild().childNodes);
					}
					return result;
				},
			},
		],
		toDOM: () => [
			'li', { class: 'md-checkbox' },
			0,
		],
	},
	taskListLabel: {
		content: 'checkBox inline*',
		group: 'block',
		parseDOM: [
			{
				tag: 'div.checkbox-wrapper',
			},
		],
		toDOM: () => [
			'label',
			0,
		],
	},
	checkBox: {
		attrs: { checked: { default: false, validate: 'boolean' } },
		inline: true,
		parseDOM: [
			{
				tag: 'input[type=checkbox]',
				getAttrs: (node) => {
					return { checked: !!(node as HTMLInputElement)?.checked };
				},
			},
		],
		toDOM: (node) => [
			'input', { type: 'checkbox', checked: node.attrs.checked ? true : undefined },
		],
	},
} satisfies Record<string, NodeSpec>;

type GetPosition = ()=> number;

export class CheckBoxItemView implements NodeView {
	public readonly dom: HTMLInputElement;

	public constructor(node: Node, view: EditorView, getPosition: GetPosition) {
		if ((node.attrs.checked ?? undefined) === undefined) {
			throw new Error(`Missing checked attribute. Node: ${node}.`);
		}

		// Don't use a <label> element as a container -- clicking on the container
		// should move focus to the task item, not focus the checkbox.
		this.dom = document.createElement('input');
		this.dom.type = 'checkbox';
		this.dom.checked = node.attrs.checked;

		this.dom.onchange = () => {
			if (node.attrs.checked !== this.dom.checked) {
				view.dispatch(view.state.tr.setNodeAttribute(
					getPosition(), 'checked', this.dom.checked,
				));
			}
		};
	}
}

const taskListPlugin = (schema: Schema<'checkBox'>) => new Plugin({
	props: {
		nodeViews: {
			checkBox: (node, view, getPos) => new CheckBoxItemView(node, view, getPos),
		},
		handleKeyDown: (view, event) => {
			if (event.key !== 'Enter' && event.code !== 'Space') {
				return false;
			}

			const selectionContent = view.state.selection.content().content;
			if (selectionContent.content.length !== 1) {
				return false;
			}

			const selectedNode = selectionContent.content[0];
			if (selectedNode.type === schema.nodes.checkBox) {
				view.dispatch(view.state.tr.setNodeAttribute(
					view.state.selection.from, 'checked', !selectedNode.attrs.checked,
				));
				return true;
			}

			return false;
		},
	},
});

export default taskListPlugin;
