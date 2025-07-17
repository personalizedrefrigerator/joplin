import { Plugin } from 'prosemirror-state';
import { Node, NodeSpec } from 'prosemirror-model';
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
		attrs: { checked: { default: false, validate: 'boolean' } },
		content: 'inline*',
		parseDOM: [
			{
				tag: 'div.checkbox-wrapper',
				getAttrs: (node) => {
					const checkbox = node.querySelector<HTMLInputElement>('input[type=checkbox]');
					return { checked: !!checkbox?.checked };
				},
				contentElement(node) {
					const result = node.cloneNode(true) as HTMLElement;
					const checkbox = result.querySelector('input[type=checkbox]');
					checkbox?.remove();
					return result;
				},
			},
		],
		toDOM: (node) => [
			'label',
			['input', {type: 'checkbox', checked: node.attrs.checked ? true : undefined }],
			['span', 0],
		],
	},
} satisfies Record<string, NodeSpec>;

type GetPosition = ()=> number;

let idCounter = 0;
class TaskListItemView implements NodeView {
	public readonly dom: HTMLElement;
	public contentDOM: HTMLElement;
	private checkbox_: HTMLInputElement;

	public constructor(node: Node, view: EditorView, getPosition: GetPosition) {
		if ((node.attrs.checked ?? undefined) === undefined) {
			throw new Error(`Missing checked attribute. Node: ${node}.`);
		}

		// Don't use a <label> element as a container -- clicking on the container
		// should move focus to the task item, not focus the checkbox.
		this.dom = document.createElement('div');
		this.dom.id = `${(idCounter++)}-checkbox-container`;
		this.dom.classList.add('checklist-item', '-flex');

		this.checkbox_ = document.createElement('input');
		this.checkbox_.type = 'checkbox';
		this.checkbox_.checked = node.attrs.checked;
		this.checkbox_.setAttribute('aria-labelledby', this.dom.id);

		this.contentDOM = document.createElement('div');

		this.dom.appendChild(this.checkbox_);
		this.dom.appendChild(this.contentDOM);

		this.checkbox_.onchange = () => {
			console.log('changed', this.checkbox_.checked, node.attrs.checked, getPosition());
			if (node.attrs.checked !== this.checkbox_.checked) {
				view.dispatch(view.state.tr.setNodeAttribute(
					getPosition(), 'checked', this.checkbox_.checked,
				));
			}
		};
	}
}

const taskListPlugin = new Plugin({
	props: {
		nodeViews: {
			taskListLabel: (node, view, getPos) => new TaskListItemView(node, view, getPos),
		},
	},
});

export default taskListPlugin;
