import { Command, EditorState, Plugin, PluginView } from 'prosemirror-state';
import { LocalizationResult, OnLocalize } from '../../../types';
import { EditorView } from 'prosemirror-view';
import createButton from '../../utils/dom/createButton';
import { getEditorApi } from '../joplinEditorApiPlugin';
import { Node } from 'prosemirror-model';
import { Icon } from '../../vendor/icons/types';

type LocalizeFunction = (_: OnLocalize)=> LocalizationResult;

interface ButtonSpec {
	icon?: Icon;
	label: LocalizeFunction;
	command: (node: Node, offset: number)=> Command;
	showForNode?: (node: Node)=> boolean;
	className?: string;
}

export enum ToolbarPosition {
	// Attempts to keep the toolbar visible when the node
	// is visible. While showing the toolbar outside the node
	// is preferred, the toolbar will be shown inside the node
	// if insufficient outside space is available.
	FloatAboveBelow,
	// Anchors the toolbar to the top right corner of the
	// associated element.
	AnchorTopRight,
}

interface TargetNode {
	offset: number;
	node: Node;
	element: Element|null;
}

class FloatingButtonBar implements PluginView {
	private container_: HTMLElement;
	private lastTarget_: TargetNode|null = null;
	private intersectionObserver_: IntersectionObserver|null;

	public constructor(
		private view_: EditorView, private targetNode_: string, private buttons_: ButtonSpec[], private position_: ToolbarPosition,
	) {
		this.container_ = document.createElement('div');
		this.container_.classList.add('floating-button-bar');

		// Prevent other elements (e.g. checkboxes, links) from being between the toolbar button and the
		// target element. If the toolbar is instead included **after** the Rich Text Editor's main content,
		// then all items included directly within the Rich Text Editor come before the toolbar in the focus
		// order.
		view_.dom.parentElement.prepend(this.container_);
		this.update(view_, null);

		if (this.position_ === ToolbarPosition.FloatAboveBelow) {
			if (typeof IntersectionObserver !== 'undefined') {
				this.intersectionObserver_ = new IntersectionObserver(() => {
					this.repositionOverlay_();
				});
			}
			document.addEventListener('scroll', this.onViewportUpdate_);
			document.addEventListener('resize', this.onViewportUpdate_);
		}
	}

	private onViewportUpdate_ = () => this.repositionOverlay_();

	private repositionOverlay_() {
		if (!this.lastTarget_) return;

		const overlay = this.container_;
		const view = this.view_;
		const target = this.lastTarget_;
		const position = this.view_.coordsAtPos(target.offset);
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

		if (this.position_ === ToolbarPosition.FloatAboveBelow) {
			const top = nodeBbox.top - parentBox.top - tooltipBox.height;
			const bottom = nodeBbox.top + nodeBbox.height - parentBox.top;
			const viewportTop = window.visualViewport.pageTop;
			const viewportBottom = viewportTop + window.visualViewport.height;
			const cursorTop = view.coordsAtPos(view.state.selection.head).top;
			const positionCandidates = [
				top,
				bottom,
				Math.max(viewportTop, top + 10),
				Math.min(viewportBottom - 10, bottom) - tooltipBox.height,
			].map(candidate => {
				const clampedToEnd = Math.min(candidate, bottom);
				const clampedToStart = Math.max(clampedToEnd, top);
				return clampedToStart;
			});
			const validCandidates = positionCandidates.filter(position => {
				return position >= viewportTop && position + tooltipBox.height <= viewportBottom && Math.abs(position - cursorTop) > 50;
			});
			overlay.style.top = `${validCandidates[0] ?? positionCandidates[0]}px`;

			const targetCenter = nodeBbox.left + nodeBbox.width / 2;
			const currentCenter = parentBox.left + tooltipBox.width / 2;
			overlay.style.left = `${Math.max(targetCenter - currentCenter, 0)}px`;
		} else if (this.position_ === ToolbarPosition.AnchorTopRight) {
			overlay.style.right = `${parentBox.width - nodeBbox.width - (nodeBbox.left - parentBox.left)}px`;
			overlay.style.top = `${nodeBbox.top - parentBox.top}px`;
		}
	}

	public update(view: EditorView, lastState: EditorState|null) {
		this.view_ = view;

		const state = view.state;
		const sameSelection = lastState && state.selection.eq(lastState.selection);
		const sameDoc = lastState && state.doc.eq(lastState.doc);
		if (sameSelection && sameDoc) {
			return;
		}

		const findTargetNode = () => {
			let target: TargetNode = null;
			state.doc.nodesBetween(state.selection.from, state.selection.to, (node, offset) => {
				if (node.type.name === this.targetNode_) {
					const dom = view.nodeDOM(offset);
					const domElement = dom instanceof HTMLElement ? dom : dom.parentElement;
					target = { node, offset, element: domElement };
					return false;
				}
				return true;
			});

			return target;
		};

		const target = findTargetNode();

		// Only observe one element at a time
		if (target?.element !== this.lastTarget_?.element) {
			if (this.lastTarget_?.element) {
				this.intersectionObserver_?.unobserve(this.lastTarget_.element);
			}

			if (target?.element) {
				this.intersectionObserver_?.observe(target.element);
			}
		}

		this.lastTarget_ = target;

		if (!target) {
			this.container_.classList.add('-hidden');
		} else {
			this.container_.classList.remove('-hidden');

			const hasCreatedButtons = this.container_.children.length === this.buttons_.length;
			if (!hasCreatedButtons) {
				const { localize } = getEditorApi(view.state);
				this.container_.replaceChildren(...this.buttons_.map(buttonSpec => {
					const label = buttonSpec.label(localize);
					const button = createButton(
						buttonSpec.icon ? { label, icon: buttonSpec.icon() } : label,
						() => { },
					);

					button.classList.add('action');
					if (buttonSpec.icon) {
						button.classList.add('action-button', '-icon');
					}

					if (buttonSpec.className) {
						button.classList.add(buttonSpec.className);
					}

					return button;
				}));
			}

			for (let i = 0; i < this.buttons_.length; i++) {
				const button = this.container_.children[i] as HTMLButtonElement;
				const buttonSpec = this.buttons_[i];

				const command = buttonSpec.command(target.node, target.offset);
				button.onclick = () => {
					command(view.state, view.dispatch, view);
				};

				button.disabled = !command(view.state);
			}

			this.repositionOverlay_();
		}
	}

	public destroy() {
		this.intersectionObserver_?.disconnect();
		this.intersectionObserver_ = null;

		document.removeEventListener('scroll', this.onViewportUpdate_);
		document.removeEventListener('resize', this.onViewportUpdate_);
	}
}

const createFloatingButtonPlugin = (nodeName: string, actions: ButtonSpec[], position: ToolbarPosition) => {
	return new Plugin({
		view: (view) => new FloatingButtonBar(view, nodeName, actions, position),
	});
};

export default createFloatingButtonPlugin;
