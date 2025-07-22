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
import { tableEditing } from 'prosemirror-tables';
import preprocessEditorInput from './utils/preprocessEditorInput';
import listPlugin from './plugins/listPlugin';
import searchExtension from './plugins/searchExtension';
import editorEventStatePlugin, { setEditorEventHandler } from './plugins/editorEventStatePlugin';
import linkTooltipPlugin from './plugins/linkTooltipPlugin';

type MarkupToHtml = (markup: string)=> Promise<RenderResult>;
type HtmlToMarkup = (html: HTMLElement)=> string;

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
	const { plugin: searchPlugin, updateState: updateSearchState } = searchExtension(props.onEvent);

	const renderAndPostprocessHtml = async (markup: string) => {
		const renderResult = await renderToHtml(markup);

		const dom = new DOMParser().parseFromString(renderResult.html, 'text/html');
		preprocessEditorInput(dom, markup);

		return { renderResult, dom };
	};

	let settings = props.settings;
	const createInitialState = async (markup: string) => {
		const { renderResult, dom } = await renderAndPostprocessHtml(markup);
		cssContainer.replaceChildren(
			document.createTextNode(renderResult.cssStrings.join('\n')),
		);

		let state = EditorState.create({
			doc: proseMirrorParser.parse(dom),
			plugins: [
				inputRulesExtension,
				keymapExtension,
				gapCursor(),
				dropCursor(),
				history(),
				searchPlugin,
				joplinEditablePlugin,
				markupTracker,
				listPlugin,
				linkTooltipPlugin,
				tableEditing({ allowTableNodeSelection: true }),
				editorEventStatePlugin,
			].flat(),
		});

		state = state.apply(setEditorEventHandler(state.tr, props.onEvent));

		return state;
	};

	const undoStackSynchronizer = new UndoStackSynchronizer(props.onEvent);
	const onDocumentUpdate = (newState: EditorState) => {
		props.onEvent({
			kind: EditorEventType.Change,
			value: stateToMarkup(newState),
		});
	};
	let lastSelectionFormatting = defaultSelectionFormatting;
	const onUpdateSelection = (newState: EditorState) => {
		const selectionFormatting = computeSelectionFormatting(newState, settings);
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

			if (transaction.selectionSet || transaction.docChanged || transaction.storedMarksSet) {
				onUpdateSelection(newState);
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
		insertText: async (text: string, _source?: UserEventSource) => {
			const { dom } = await renderAndPostprocessHtml(text);
			view.pasteHTML(new XMLSerializer().serializeToString(dom));
		},
		updateBody: async (newBody: string, _updateBodyOptions?: UpdateBodyOptions) => {
			view.updateState(await createInitialState(newBody));
		},
		updateSettings: (newSettings: EditorSettings) => {
			settings = newSettings;
		},
		updateLink: (label: string, url: string) => {
			const doc = view.state.doc;
			const selection = view.state.selection;
			let transaction: Transaction = view.state.tr;

			// Helper functions that return the selection at the current stage of
			// the transaction:
			const selectionFrom = () => transaction.mapping.map(selection.from);
			const selectionTo = () => transaction.mapping.map(selection.to);


			let linkFrom = selectionFrom();
			let linkTo = selectionTo();
			doc.nodesBetween(selection.from, selection.to, (node, position) => {
				const linkMark = node.marks.find(mark => mark.type === schema.marks.link);
				if (linkMark) {
					linkFrom = position;
					linkTo = position + node.nodeSize;
					transaction = transaction.removeMark(
						position, position + node.nodeSize, schema.marks.link,
					);
				}
			});

			// Update the link text -- if an existing link, replace just the text
			// in that link.
			if (label !== transaction.doc.textBetween(linkFrom, linkTo)) {
				transaction = transaction.insertText(
					label,
					linkFrom,
					linkTo,
				);
			}

			// Add the URL
			if (url) {
				transaction = transaction.addMark(
					// Use the entire selection,
					linkFrom,
					linkTo,
					schema.mark(schema.marks.link, { href: url }),
				);
			}

			view.dispatch(transaction);
		},
		setSearchState: (newState: SearchState) => {
			view.dispatch(updateSearchState(view.state, newState));
		},
		setContentScripts: (_plugins: ContentScriptData[]) => {
			throw new Error('setContentScripts not implemented.');
		},
	};
	return editorControl;
};

export default createEditor;
