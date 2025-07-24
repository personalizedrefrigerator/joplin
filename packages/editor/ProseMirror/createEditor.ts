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
import joplinEditorApiPlugin, { setEditorApi } from './plugins/joplinEditorApiPlugin';
import linkTooltipPlugin from './plugins/linkTooltipPlugin';
import { RendererControl } from './types';
import resourcePlaceholderPlugin, { onResourceDownloaded } from './plugins/resourcePlaceholderPlugin';
import getFileFromPasteEvent from '../utils/getFileFromPasteEvent';
import { RenderResult } from '../../renderer/types';

const createEditor = async (
	parentElement: HTMLElement,
	props: EditorProps,
	renderer: RendererControl,
): Promise<EditorControl> => {
	const renderNodeToMarkup = (node: Node|DocumentFragment) => {
		const element = document.createElement('div');
		element.appendChild(node);
		return renderer.renderHtmlToMarkup(element);
	};

	const proseMirrorParser = ProseMirrorDomParser.fromSchema(schema);

	const cssContainer = document.createElement('style');
	parentElement.appendChild(cssContainer);

	const { plugin: markupTracker, stateToMarkup } = originalMarkupPlugin(renderNodeToMarkup);
	const { plugin: searchPlugin, updateState: updateSearchState } = searchExtension(props.onEvent);

	const renderAndPostprocessHtml = async (markup: string) => {
		const renderResult = await renderer.renderMarkupToHtml(markup);

		const dom = new DOMParser().parseFromString(renderResult.html, 'text/html');
		preprocessEditorInput(dom, markup);

		return { renderResult, dom };
	};
	const updateGlobalCss = (renderResult: RenderResult) => {
		cssContainer.replaceChildren(
			document.createTextNode(renderResult.cssStrings.join('\n')),
		);
	};

	let settings = props.settings;
	const createInitialState = async (markup: string) => {
		const { renderResult, dom } = await renderAndPostprocessHtml(markup);
		updateGlobalCss(renderResult);

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
				joplinEditorApiPlugin,
				resourcePlaceholderPlugin,
			].flat(),
		});

		state = state.apply(
			setEditorApi(state.tr, {
				onEvent: props.onEvent,
				renderer,
			}),
		);

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
		handleDOMEvents: {
			paste: (_view, event) => {
				const fileToPaste = getFileFromPasteEvent(event);
				if (fileToPaste) {
					event.preventDefault();
					void props.onPasteFile(fileToPaste);
					return true;
				}
				return false;
			},
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
		updateSettings: async (newSettings: EditorSettings) => {
			const oldSettings = settings;
			settings = newSettings;

			if (oldSettings.themeData.themeId !== newSettings.themeData.themeId) {
				// Refresh global CSS when the theme changes -- render the full document
				// to avoid required CSS being omitted due to missing markup.
				const { renderResult } = await renderAndPostprocessHtml(stateToMarkup(view.state));
				updateGlobalCss(renderResult);
			}
		},
		updateLink: (label: string, url: string) => {
			const doc = view.state.doc;
			const selection = view.state.selection;
			let transaction: Transaction = view.state.tr;

			let linkFrom = selection.from;
			let linkTo = selection.to;
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

			// Helper functions that return a point at the current stage of
			// the transaction:
			const map = (position: number, associativity: number) => transaction.mapping.map(position, associativity);

			// Update the link text -- if an existing link, replace just the text
			// in that link.
			if (label !== transaction.doc.textBetween(linkFrom, linkTo)) {
				transaction = transaction.insertText(
					label,
					linkFrom,
					linkTo,
				);
				linkFrom = map(linkFrom, -1); // Ensure that linkFrom is to the left of the text
				linkTo = map(linkTo, 1); // Ensure that linkTo is to the right of the text
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
		onResourceDownloaded: async (resourceId: string) => {
			const rendered = await renderAndPostprocessHtml(`<img src=":/${resourceId}"/>`);
			const renderedImage = rendered.dom.querySelector('img');

			if (!renderedImage) {
				throw new Error('Rendering failed -- no rendered image found.');
			}
			// The resource might not be an image. If so, skip.
			if (renderedImage.classList.contains('not-loaded-resource')) {
				return;
			}

			const resourceSrc = renderedImage?.src;
			onResourceDownloaded(view, resourceId, resourceSrc);
		},
	};
	return editorControl;
};

export default createEditor;
