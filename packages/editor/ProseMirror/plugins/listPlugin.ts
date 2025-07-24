import { Plugin } from 'prosemirror-state';
import { Node, NodeSpec } from 'prosemirror-model';
import { Decoration, DecorationSet, EditorView, NodeView } from 'prosemirror-view';
import trimEmptyParagraphs from '../utils/trimEmptyParagraphs';
import changedDescendants from '../vendor/changedDescendants';

// See the fold example for more information about
// writing similar ProseMirror plugins:
// https://prosemirror.net/examples/fold/

const listGroup = 'block';

// Note: Use snake_case for schema keys for compatibility with certain default ProseMirror code
// (e.g. default input rules from prosemirror-example-setup).
export const nodeSpecs = {
	task_list: {
		content: 'list_item+',
		group: listGroup,
		parseDOM: [{ tag: 'ul[data-is-checklist]' }],
		toDOM: () => ['ul', { class: 'task-list', 'data-is-checklist': '1' }, 0],
	},
	ordered_list: {
		content: 'list_item+',
		group: listGroup,

		// Match attributes from https://github.com/ProseMirror/prosemirror-schema-list/blob/master/src/schema-list.ts
		attrs: { order: { default: 1, validate: 'number' } },
		parseDOM: [
			{
				tag: 'ol',
				getAttrs: node => {
					const start = node.hasAttribute('start') ? Number(node.getAttribute('start')) : 1;
					return {
						order: isFinite(start) ? start : 1,
					};
				},
			},
		],
		toDOM: node => (
			node.attrs.order === 1 ? ['ol', 0] : ['ol', { start: node.attrs.order }, 0]
		),
	},
	bullet_list: {
		content: 'list_item+',
		group: listGroup,

		parseDOM: [{ tag: 'ul:not([data-is-checklist])' }],
		toDOM: () => ['ul', 0],
	},
	list_item: {
		content: 'paragraph block*',
		attrs: {
			checked: { default: undefined as boolean|undefined, validate: 'boolean|undefined' },
		},
		defining: true,
		draggable: true,

		parseDOM: [
			{
				tag: 'li.md-checkbox',
				getAttrs(node) {
					const checkbox = node.querySelector<HTMLInputElement>('input[type=checkbox]');
					return { checked: checkbox?.checked };
				},
				contentElement(node) {
					const result = node.cloneNode(true) as HTMLElement;

					// Empty paragraphs can cause rendering issues.
					trimEmptyParagraphs(result);

					const firstChild = result.children[0];
					if (firstChild?.matches('div.checkbox-wrapper')) {
						firstChild.remove();

						// Trim empty paragraphs without the first child.
						// Without this, multiple empty paragraphs can accumulate between
						// the list item and its sub-lists.
						trimEmptyParagraphs(result);

						result.prepend(...firstChild.childNodes);
					}
					return result;
				},
			},
		],
		toDOM: (node) => {
			if (node.attrs.checked !== undefined) {
				return [
					'li', { class: 'md-checkbox' },
					['input', { type: 'checkbox', checked: node.attrs.checked ? true : undefined }],
					['div', 0],
				];
			} else {
				return ['li', 0];
			}
		},
	},
} satisfies Record<string, NodeSpec>;

type GetPosition = ()=> number;

let idCounter = 0;
class TaskListItemView implements NodeView {
	public readonly dom: HTMLElement;
	public contentDOM: HTMLElement;
	private checkbox_: HTMLInputElement|null = null;

	public constructor(private node_: Node, private view_: EditorView, private getPosition_: GetPosition, decorations: readonly Decoration[]) {
		this.dom = document.createElement('li');
		if (decorations.some(deco => deco.spec.isTaskList)) {
			this.createCheckbox_();
		} else {
			this.contentDOM = this.dom;
		}
	}

	public update(node: Node, decorations: readonly Decoration[]) {
		if (node.type.spec !== nodeSpecs.list_item) return false;

		const isTaskList = decorations.some(deco => deco.spec.isTaskList);
		const wasTaskList = !!this.checkbox_;
		if (isTaskList !== wasTaskList) return false;

		if (isTaskList) {
			this.node_ = node;
			this.checkbox_.checked = node.attrs.checked;
		}
		return true;
	}

	private createCheckbox_() {
		// Already a checkbox? No need to recreate it.
		if (this.checkbox_) {
			this.checkbox_.checked = this.node_.attrs.checked;
			return;
		}

		this.dom.replaceChildren();

		this.dom.id = `${(idCounter++)}-checkbox-container`;
		this.dom.classList.add('checklist-item', 'md-checkbox', '-flex');

		this.checkbox_ = document.createElement('input');
		this.checkbox_.type = 'checkbox';
		this.checkbox_.checked = this.node_.attrs.checked;
		// Don't use a <label> element as a container since clicking on the container
		// should move focus to the task item, not focus the checkbox.
		// Instead use aria-labelledby for accessibility:
		this.checkbox_.setAttribute('aria-labelledby', this.dom.id);

		this.contentDOM = document.createElement('div');
		this.contentDOM.classList.add('content');

		this.dom.appendChild(this.checkbox_);
		this.dom.appendChild(this.contentDOM);

		this.checkbox_.onchange = () => {
			if (this.node_.attrs.checked !== this.checkbox_.checked) {
				this.view_.dispatch(this.view_.state.tr.setNodeAttribute(
					this.getPosition_(), 'checked', this.checkbox_.checked,
				));
			}
		};
	}
}

const listPlugin = new Plugin({
	state: {
		init: (_config, state) => {
			const decorations = DecorationSet.empty;
			const taskListDecorations: Decoration[] = [];
			state.doc.descendants((node, pos) => {
				if (node.type.name === 'list_item') {
					const resolved = state.doc.resolve(pos);
					if (resolved.parent.type.name === 'task_list') {
						taskListDecorations.push(
							Decoration.node(pos, pos + node.nodeSize, { 'data-isTask': 'true' }, { isTaskList: true }),
						);
					}
				}
				return !node.isInline;
			});

			return decorations.add(state.doc, taskListDecorations);
		},
		apply: (tr, decorations, oldState, _newState) => {
			decorations = decorations.map(tr.mapping, tr.doc);
			changedDescendants(oldState.doc, tr.doc, 0, (node, pos) => {
				if (node.type.spec === nodeSpecs.list_item) {
					const resolved = tr.doc.resolve(pos);
					const isTaskList = resolved.parent.type.name === 'task_list';
					const oldTaskListDecorations = decorations.find(pos, pos + node.nodeSize).filter(
						d => d.from === pos && d.to === pos + node.nodeSize && d.spec.isTaskList,
					);
					const wasTaskList = oldTaskListDecorations.length > 0;

					if (wasTaskList && !isTaskList) {
						decorations = decorations.remove(oldTaskListDecorations);
					} else if (isTaskList) {
						decorations = decorations.add(tr.doc, [
							Decoration.node(pos, pos + node.nodeSize, { 'data-isTask': 'true' }, { isTaskList }),
						]);
					}
				}
			});
			return decorations;
		},
	},
	props: {
		nodeViews: {
			list_item: (node, view, getPos, decorations) => new TaskListItemView(node, view, getPos, decorations),
		},
		decorations(state) {
			return this.getState(state);
		},
	},
});

export default listPlugin;
