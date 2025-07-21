
import { EditorState, Plugin } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import schema from '../schema';
import { getEditorEventHandler } from './editorEventStatePlugin';
import { EditorEventType } from '../../events';
import { OnEventCallback } from '../../types';

// This plugin is similar to https://prosemirror.net/examples/tooltip/

class LinkTooltip {
	private tooltip_: HTMLElement;
	private tooltipContent_: HTMLButtonElement;
	private onEditorEvent_: OnEventCallback|null = null;

	public constructor(view: EditorView) {
		this.tooltip_ = document.createElement('div');
		this.tooltip_.classList.add('link-tooltip', '-hidden');
		this.tooltipContent_ = document.createElement('button');
		this.tooltipContent_.classList.add('link');
		this.tooltipContent_.role = 'link';
		this.tooltip_.appendChild(this.tooltipContent_);

		view.dom.parentElement.appendChild(this.tooltip_);

		this.update(view, null);
	}

	public update(view: EditorView, lastState: EditorState) {
		const state = view.state;
		this.onEditorEvent_ = getEditorEventHandler(state);

		const sameSelection = lastState && state.selection.eq(lastState.selection);
		const sameDoc = lastState && state.doc.eq(lastState.doc);
		if (sameSelection && sameDoc) {
			return;
		}


		const selectionMarks = state.selection.$anchor.marks();
		const linkMark = selectionMarks.find(mark => mark.type === schema.marks.link);
		const show = state.selection.empty && linkMark;

		if (!show) {
			this.tooltip_.classList.add('-hidden');
			this.tooltipContent_.onclick = () => {};
		} else {
			this.tooltipContent_.textContent = linkMark.attrs.href;
			this.tooltipContent_.onclick = () => {
				this.onEditorEvent_({
					kind: EditorEventType.FollowLink,
					link: linkMark.attrs.href,
				});
			};

			this.tooltip_.classList.remove('-hidden');
			const position = view.coordsAtPos(state.selection.from);
			const parentBox = this.tooltip_.offsetParent.getBoundingClientRect();
			const tooltipBox = this.tooltip_.getBoundingClientRect();
			this.tooltip_.style.top = `${position.top - parentBox.top + tooltipBox.height}px`;
			this.tooltip_.style.left = `${Math.max(position.left - parentBox.left - tooltipBox.width / 2, 0)}px`;
		}
	}

	public destroy() {
		this.tooltip_.remove();
	}
}

const linkTooltipPlugin = new Plugin({
	view: view => new LinkTooltip(view),
});

export default linkTooltipPlugin;
