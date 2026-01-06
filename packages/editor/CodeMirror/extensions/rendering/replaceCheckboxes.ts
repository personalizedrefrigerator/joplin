import { Decoration, EditorView, WidgetType } from '@codemirror/view';
import { SyntaxNodeRef } from '@lezer/common';
import makeReplaceExtension from './utils/makeInlineReplaceExtension';
import toggleCheckboxAt from '../../utils/markdown/toggleCheckboxAt';

const checkboxClassName = 'cm-ext-checkbox-toggle';


class CheckboxWidget extends WidgetType {
	public constructor(
		private checked: boolean,
		private depth: number,
		private label: string,
		private markup: string,
	) {
		super();
	}

	public eq(other: CheckboxWidget) {
		return other.checked === this.checked
			&& other.depth === this.depth
			&& other.label === this.label
			&& other.markup === this.markup;
	}

	private applyContainerClasses(container: HTMLElement) {
		container.classList.add(checkboxClassName);
		// For sizing: Should have the same font/styles as non-rendered checkboxes:
		container.classList.add('cm-taskMarker');

		for (const className of [...container.classList]) {
			if (className.startsWith('-depth-')) {
				container.classList.remove(className);
			}
		}

		container.classList.add(`-depth-${this.depth}`);
	}

	public toDOM(view: EditorView) {
		const container = document.createElement('span');

		const sizingNode = document.createElement('span');
		sizingNode.classList.add('sizing');
		sizingNode.textContent = this.markup;
		container.appendChild(sizingNode);

		const checkbox = document.createElement('input');
		checkbox.type = 'checkbox';
		checkbox.checked = this.checked;
		checkbox.ariaLabel = this.label;
		checkbox.title = this.label;
		checkbox.classList.add('content');
		container.appendChild(checkbox);

		checkbox.oninput = () => {
			toggleCheckboxAt(view.posAtDOM(container))(view);
		};

		this.applyContainerClasses(container);
		return container;
	}

	public updateDOM(dom: HTMLElement): boolean {
		this.applyContainerClasses(dom);

		const input = dom.querySelector('input');
		if (input) {
			input.checked = this.checked;
			return true;
		}
		return false;
	}

	public ignoreEvent() {
		return false;
	}
}

const completedTaskClassName = 'cm-md-completed-item';
const completedListItemDecoration = Decoration.line({ class: completedTaskClassName, isFullLine: true });

const replaceCheckboxes = [
	EditorView.theme({
		[`& .${checkboxClassName}`]: {
			position: 'relative',

			'& > input': {
				width: '1.1em',
				height: '1.1em',
				marginTop: '4px',
				marginBottom: '4px',

				// Center it:
				marginLeft: 'auto',
				marginRight: 'auto',
				verticalAlign: 'middle',
			},

			'& > .sizing': {
				visibility: 'hidden',
			},

			'& > .content': {
				position: 'absolute',
				left: '0',
				right: '0',
			},
		},
		[`& .${completedTaskClassName}`]: {
			opacity: 0.69,
		},
	}),
	EditorView.domEventHandlers({
		mousedown: (event) => {
			const target = event.target as Element;
			if (target.nodeName === 'INPUT' && target.parentElement?.classList?.contains(checkboxClassName)) {
				// Let the checkbox handle the event
				return true;
			}
			return false;
		},
	}),
	makeReplaceExtension({
		createDecoration: (node, state, parentTags) => {
			const markerIsChecked = (marker: SyntaxNodeRef) => {
				const content = state.doc.sliceString(marker.from, marker.to);
				return content.toLowerCase().indexOf('x') !== -1;
			};

			if (node.name === 'TaskMarker') {
				const containerLine = state.doc.lineAt(node.from);
				const labelText = state.doc.sliceString(node.to, containerLine.to);
				const markerText = state.doc.sliceString(node.from, node.to);

				return new CheckboxWidget(
					markerIsChecked(node),
					parentTags.get('ListItem') ?? 0,
					labelText,
					markerText,
				);
			} else if (node.name === 'Task') {
				const marker = node.node.getChild('TaskMarker');
				if (marker && markerIsChecked(marker)) {
					return completedListItemDecoration;
				}
			}
			return null;
		},
		getDecorationRange: (node, state) => {
			if (node.name === 'TaskMarker') {
				const container = node.node.parent?.parent;
				const listMarker = container?.getChild('ListMark');
				if (!listMarker) {
					return null;
				}

				return [node.from, node.to];
			} else if (node.name === 'Task') {
				const taskLine = state.doc.lineAt(node.from);
				return [taskLine.from];
			}

			return null;
		},
	}),
];

export default replaceCheckboxes;
