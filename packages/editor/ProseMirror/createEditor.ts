import { ContentScriptData, EditorCommandType, EditorControl, EditorProps, EditorSettings, SearchState, UpdateBodyOptions, UserEventSource } from '../types';
import { EditorState, TextSelection, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { DOMParser as ProseMirrorDomParser } from 'prosemirror-model';
import { history } from 'prosemirror-history';
import commands from './commands';
import schema from './schema';
import { gapCursor } from 'prosemirror-gapcursor';
import { dropCursor } from 'prosemirror-dropcursor';
import { EditorEventType } from '../events';
import { RenderResult } from '../../renderer/types';
import UndoStackSynchronizer from './utils/UndoStackSynchronizer';
import computeSelectionFormatting from './utils/computeSelectionFormatting';
import { defaultSelectionFormatting, selectionFormattingEqual } from '../SelectionFormatting';
import joplinEditablePlugin from './plugins/joplinEditablePlugin';
import keymapExtension from './plugins/keymapExtension';
import inputRulesExtension from './plugins/inputRulesExtension';
import originalMarkupPlugin from './plugins/originalMarkupPlugin';

type MarkupToHtml = (markup: string)=> Promise<RenderResult>;
type HtmlToMarkup = (html: HTMLElement)=> string;

// Uses the renderer's source-line and source-line-end attributes to
// reconstruct the original Markdown for different parts of the given
// DOM.
const addOriginalMarkdownAttrs = (dom: Document, originalMarkup: string) => {
	const lines = originalMarkup.split('\n');

	const isOnlyChild = (element: Element) => {
		return element.parentElement && element.parentElement.children.length === 1;
	};
	const root = dom.querySelector('body > #rendered-md') ?? dom.body ?? dom.getRootNode();
	const isToplevel = (element: Element): boolean => {
		return element.parentElement === root || (isOnlyChild(element) && isToplevel(element.parentElement));
	};
	const sourceMappedToplevelElements = [
		...dom.querySelectorAll('.maps-to-line[source-line][source-line-end]'),
	].filter(isToplevel);

	let lastEndLine = -1;
	let lastElement: Element = null;
	for (const elem of sourceMappedToplevelElements) {
		const startLine = Number(elem.getAttribute('source-line'));
		const endLine = Number(elem.getAttribute('source-line-end'));

		// If the source map of two adjacent nodes overlaps, we can't know which
		// part of which source line corresponds to the element.
		if (startLine <= lastEndLine) {
			lastElement?.removeAttribute('data-original-markup');
			lastElement = null;
			continue;
		}

		elem.setAttribute('data-original-markup', lines.slice(startLine, endLine).join('\n'));
		lastEndLine = endLine;
		lastElement = elem;
	}
};

const createEditor = async (
	parentElement: HTMLElement,
	props: EditorProps,
	renderToHtml: MarkupToHtml,
	renderToMarkup: HtmlToMarkup,
): Promise<EditorControl> => {
	const renderNodeToMarkup = (node: Node|DocumentFragment) => {
		const element = document.createElement('div');
		element.appendChild(node);
		return renderToMarkup(element);
	};

	const proseMirrorParser = ProseMirrorDomParser.fromSchema(schema);

	const cssContainer = document.createElement('style');
	parentElement.appendChild(cssContainer);

	const { plugin: markupTracker, stateToMarkup } = originalMarkupPlugin(renderNodeToMarkup);

	let settings = props.settings;
	const createInitialState = async (markup: string) => {
		const renderResult = await renderToHtml(markup);
		cssContainer.replaceChildren(
			document.createTextNode(renderResult.cssStrings.join('\n')),
		);

		const dom = new DOMParser().parseFromString(renderResult.html, 'text/html');
		addOriginalMarkdownAttrs(dom, markup);

		return EditorState.create({
			doc: proseMirrorParser.parse(dom),
			plugins: [
				inputRulesExtension,
				keymapExtension,
				gapCursor(),
				dropCursor(),
				history(),
				joplinEditablePlugin,
				markupTracker,
			].flat(),
		});
	};

	const undoStackSynchronizer = new UndoStackSynchronizer(props.onEvent);
	const onDocumentUpdate = (newState: EditorState) => {
		props.onEvent({
			kind: EditorEventType.Change,
			value: stateToMarkup(newState),
		});
	};
	let lastSelectionFormatting = defaultSelectionFormatting;
	const onUpdateSelection = (transaction: Transaction) => {
		const selectionFormatting = computeSelectionFormatting(transaction.doc, transaction.selection, settings);
		if (!selectionFormattingEqual(lastSelectionFormatting, selectionFormatting)) {
			lastSelectionFormatting = selectionFormatting;
			props.onEvent({
				kind: EditorEventType.SelectionFormattingChange,
				formatting: selectionFormatting,
			});
		}
	};

	const view = new EditorView(parentElement, {
		state: await createInitialState(props.initialText),
		dispatchTransaction: transaction => {
			const newState = view.state.apply(transaction);

			if (transaction.docChanged) {
				onDocumentUpdate(newState);
			}

			if (transaction.selectionSet || transaction.docChanged) {
				onUpdateSelection(transaction);
			}

			undoStackSynchronizer.schedulePostUndoRedoDepthChange(view);

			view.updateState(newState);
		},
		attributes: {
			'aria-label': settings.editorLabel,
			class: 'prosemirror-editor',
		},
	});

	const editorControl: EditorControl = {
		supportsCommand: (name: EditorCommandType | string) => {
			return name in commands && !!commands[name as keyof typeof commands];
		},
		execCommand: (name: EditorCommandType | string, ..._args: unknown[]) => {
			if (!editorControl.supportsCommand(name)) {
				throw new Error(`Unsupported command: ${name}`);
			}

			commands[name as keyof typeof commands](view.state, view.dispatch, view);
		},
		undo: () => {
			void editorControl.execCommand(EditorCommandType.Undo);
		},
		redo: () => {
			void editorControl.execCommand(EditorCommandType.Redo);
		},
		select: function(anchor: number, head: number): void {
			const transaction = view.state.tr;
			transaction.setSelection(
				TextSelection.create(transaction.doc, anchor, head),
			);
			view.dispatch(transaction);
		},
		setScrollPercent: (fraction: number) => {
			// TODO: Handle this in a better way?
			document.scrollingElement.scrollTop = fraction * document.scrollingElement.scrollHeight;
		},
		insertText: (text: string, _source?: UserEventSource) => {
			view.dispatch(view.state.tr.insertText(text));
		},
		updateBody: async (newBody: string, _updateBodyOptions?: UpdateBodyOptions) => {
			view.updateState(await createInitialState(newBody));
		},
		updateSettings: (newSettings: EditorSettings) => {
			settings = newSettings;
		},
		updateLink: function(_label: string, _url: string): void {
			throw new Error('Function not implemented.');
		},
		setSearchState: function(_state: SearchState): void {
			throw new Error('Function not implemented.');
		},
		setContentScripts: function(_plugins: ContentScriptData[]): Promise<void> {
			throw new Error('Function not implemented.');
		},
	};
	return editorControl;
};

export default createEditor;
