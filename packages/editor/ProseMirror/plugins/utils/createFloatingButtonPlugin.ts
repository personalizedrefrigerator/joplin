import { Command, EditorState, Plugin } from 'prosemirror-state';
import { LocalizationResult, OnLocalize } from '../../../types';
import { EditorView } from 'prosemirror-view';
import createButton from '../../utils/dom/createButton';
import { getEditorApi } from '../joplinEditorApiPlugin';
import { Node } from 'prosemirror-model';

type LocalizeFunction = (_: OnLocalize)=> LocalizationResult;

interface ButtonSpec {
	label: LocalizeFunction;
	command: (node: Node, offset: number)=> Command;
	showForNode?: (node: Node)=> boolean;
}

export enum ToolbarPosition {
	TopLeftOutside,
	TopRightInside,
}

class FloatingButtonBar {
	private container_: HTMLElement;

	public constructor(
		view: EditorView, private targetNode_: string, private buttons_: ButtonSpec[], private position_: ToolbarPosition,
	) {
		this.container_ = document.createElement('div');
		this.container_.classList.add('floating-button-bar');

		view.dom.parentElement.appendChild(this.container_);
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
			type TargetNode = { offset: number; node: Node };
			let target: TargetNode = null;
			state.doc.nodesBetween(state.selection.from, state.selection.to, (node, offset) => {
				if (node.type.name === this.targetNode_) {
					target = { node, offset };
					return false;
				}
				return true;
			});

			return target;
		};

		const target = findTargetNode();
		if (!target) {
			this.container_.classList.add('-hidden');
		} else {
			this.container_.classList.remove('-hidden');

			const hasCreatedButtons = this.container_.children.length === this.buttons_.length;
			if (!hasCreatedButtons) {
				const { localize } = getEditorApi(view.state);
				this.container_.replaceChildren(...this.buttons_.map(buttonSpec => {
					const button = createButton(
						buttonSpec.label(localize),
						() => { },
					);
					button.classList.add('action');
					return button;
				}));
			}

			for (let i = 0; i < this.buttons_.length; i++) {
				const button = this.container_.children[i] as HTMLButtonElement;
				const buttonSpec = this.buttons_[i];
				button.onclick = () => {
					buttonSpec.command(target.node, target.offset)(view.state, view.dispatch, view);
				};

				if (buttonSpec.showForNode && !buttonSpec.showForNode(target.node)) {
					button.classList.add('-hidden');
					button.disabled = true;
				} else {
					button.classList.remove('-hidden');
					button.disabled = false;
				}
			}

			const position = view.coordsAtPos(target.offset);
			// Fall back to document.body to support testing environments:
			const parentBox = (this.container_.offsetParent ?? document.body).getBoundingClientRect();
			const tooltipBox = this.container_.getBoundingClientRect();

			this.container_.style.left = '';
			this.container_.style.right = '';

			const nodeElement = view.nodeDOM(target.offset);
			const nodeBbox = nodeElement instanceof HTMLElement ? nodeElement.getBoundingClientRect() : {
				...position,
				width: 0,
				height: 0,
			};

			let top = nodeBbox.top - parentBox.top;
			if (this.position_ === ToolbarPosition.TopLeftOutside) {
				top -= tooltipBox.height;
				this.container_.style.left = `${Math.max(nodeBbox.left - parentBox.left, 0)}px`;
			} else if (this.position_ === ToolbarPosition.TopRightInside) {
				this.container_.style.right = `${parentBox.width - nodeBbox.width - (nodeBbox.left - parentBox.left)}px`;
			}
			this.container_.style.top = `${top}px`;
		}
	}
}

const createFloatingButtonPlugin = (nodeName: string, actions: ButtonSpec[], position: ToolbarPosition) => {
	return new Plugin({
		view: (view) => new FloatingButtonBar(view, nodeName, actions, position),
	});
};

export default createFloatingButtonPlugin;
