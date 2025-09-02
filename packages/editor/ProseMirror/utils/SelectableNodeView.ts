import { NodeView } from 'prosemirror-view';
import { LocalizationResult } from '../../types';
import createButton from './dom/createButton';

export type GetPosition = ()=> number;

export default class SelectableNodeView implements NodeView {
	public readonly dom: HTMLElement;
	public constructor(inline: boolean) {
		this.dom = document.createElement(inline ? 'span' : 'div');
		this.dom.classList.add('joplin-selectable');
	}

	private getActionContainer_() {
		return this.dom.querySelector(':scope > .actions');
	}

	protected addActionButton(label: LocalizationResult, onClick: ()=> void) {
		let actions = this.getActionContainer_();
		if (!actions) {
			actions = document.createElement('span');
			actions.classList.add('actions');
			this.dom.appendChild(actions);
		}

		const button = createButton(label, onClick);
		actions.appendChild(button);
		return button;
	}

	public selectNode() {
		this.dom.classList.add('-selected');
	}

	public deselectNode() {
		this.dom.classList.remove('-selected');
	}

	public stopEvent(event: Event) {
		if (!(event.target instanceof HTMLElement)) return false;

		// Allow using the keyboard to activate action buttons:
		return event.target.parentElement === this.getActionContainer_();
	}
}
