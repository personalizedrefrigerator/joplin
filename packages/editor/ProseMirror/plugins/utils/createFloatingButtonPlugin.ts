import { Command, EditorState, Plugin } from 'prosemirror-state';
import { LocalizationResult, OnLocalize } from '../../../types';
import { EditorView } from 'prosemirror-view';
import createButton from '../../utils/dom/createButton';
import { getEditorApi } from '../joplinEditorApiPlugin';

type LocalizeFunction = (_: OnLocalize)=> LocalizationResult;

interface ButtonSpec {
	label: LocalizeFunction;
	command: Command;
}

class FloatingButtonBar {
	private container_: HTMLElement;

	public constructor(view: EditorView, private targetNode_: string, private buttons_: ButtonSpec[]) {
		this.container_ = document.createElement('div');
		this.container_.classList.add('floating-button-bar');

		view.dom.parentElement.prepend(this.container_);
		this.update(view, null);
	}

	public update(view: EditorView, lastState: EditorState|null) {
		const state = view.state;
		const sameSelection = lastState && state.selection.eq(lastState.selection);
		const sameDoc = lastState && state.doc.eq(lastState.doc);
		if (sameSelection && sameDoc) {
			return;
		}

		const findTargetNode = () => {
			const anchor = view.state.selection.$anchor;
			for (let i = 0; i <= anchor.depth; i++) {
				const node = anchor.node(i);
				if (node?.type?.name === this.targetNode_) {
					return { node, offset: anchor.posAtIndex(0, i) };
				}
			}
			return null;
		};

		const target = findTargetNode();
		if (!target) {
			this.container_.classList.add('-hidden');
		} else {
			this.container_.classList.remove('-hidden');

			if (this.container_.children.length !== this.buttons_.length) {
				const { localize } = getEditorApi(view.state);
				this.container_.replaceChildren(...this.buttons_.map(button => {
					return createButton(
						button.label(localize),
						() => { },
					);
				}));
			}

			for (let i = 0; i < this.buttons_.length; i++) {
				const button = this.container_.children[i] as HTMLButtonElement;
				const buttonSpec = this.buttons_[i];
				button.onclick = () => {
					buttonSpec.command(view.state, view.dispatch);
				};
			}

			const position = view.coordsAtPos(target.offset);
			// TODO: Reduce code duplication with linkTooltipPlugin.
			// Fall back to document.body to support testing environments:
			const parentBox = (this.container_.offsetParent ?? document.body).getBoundingClientRect();
			const tooltipBox = this.container_.getBoundingClientRect();
			this.container_.style.top = `${position.top - parentBox.top - tooltipBox.height}px`;
			this.container_.style.left = `${Math.max(position.left, 0)}px`;
		}
	}
}

const createFloatingButtonPlugin = (nodeName: string, actions: ButtonSpec[]) => {
	return new Plugin({
		view: (view) => new FloatingButtonBar(view, nodeName, actions),
	});
};

export default createFloatingButtonPlugin;
