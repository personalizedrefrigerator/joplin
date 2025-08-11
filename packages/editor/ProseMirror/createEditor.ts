import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import ImageKit from '@tiptap/extension-image';
import { TableKit } from '@tiptap/extension-table';
import { ContentScriptData, EditorCommandType, EditorControl, EditorProps, EditorSettings, SearchState, UpdateBodyOptions, UserEventSource } from '../types';
import commands from './commands';
import { EditorEventType } from '../events';
import { RenderResult } from '../../renderer/types';
import UndoStackSynchronizer from './utils/UndoStackSynchronizer';
import computeSelectionFormatting from './utils/computeSelectionFormatting';
import { defaultSelectionFormatting, selectionFormattingEqual } from '../SelectionFormatting';
import originalMarkupPlugin from './plugins/originalMarkupPlugin';
import preprocessEditorInput from './utils/preprocessEditorInput';
import searchExtension from './plugins/searchExtension';
import editorEventStatePlugin, { setEditorEventHandler } from './plugins/editorEventStatePlugin';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { TextSelection, Transaction } from '@tiptap/pm/state';
import wrapProseMirrorPlugin from './utils/wrapProseMirrorPlugin';
import joplinEditablePlugin from './plugins/joplinEditablePlugin';
import Link from '@tiptap/extension-link';

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

	const cssContainer = document.createElement('style');
	parentElement.appendChild(cssContainer);

	const { plugin: markupTracker, stateToMarkup } = originalMarkupPlugin(renderNodeToMarkup);
	const { plugin: searchPlugin, updateState: updateSearchState } = searchExtension(props.onEvent);

	let settings = props.settings;
	const renderInitialMarkup = async (markup: string) => {
		const renderResult = await renderToHtml(markup);
		cssContainer.replaceChildren(
			document.createTextNode(renderResult.cssStrings.join('\n')),
		);

		const dom = new DOMParser().parseFromString(renderResult.html, 'text/html');
		preprocessEditorInput(dom, markup);
		return new XMLSerializer().serializeToString(dom.body);
	};

	const undoStackSynchronizer = new UndoStackSynchronizer(props.onEvent);
	type TipTapEditorEvent = { editor: Editor; transaction: Transaction };
	const onDocumentUpdate = ({ editor }: TipTapEditorEvent) => {
		props.onEvent({
			kind: EditorEventType.Change,
			value: stateToMarkup(editor.view.state),
		});

		undoStackSynchronizer.schedulePostUndoRedoDepthChange(editor.view);
	};
	let lastSelectionFormatting = defaultSelectionFormatting;
	const onUpdateSelection = ({ transaction }: TipTapEditorEvent) => {
		const selectionFormatting = computeSelectionFormatting(transaction.doc, editor.schema, transaction.selection, settings);
		if (!selectionFormattingEqual(lastSelectionFormatting, selectionFormatting)) {
			lastSelectionFormatting = selectionFormatting;
			props.onEvent({
				kind: EditorEventType.SelectionFormattingChange,
				formatting: selectionFormatting,
			});
		}
	};

	const editor = new Editor({
		element: parentElement,
		extensions: [
			StarterKit,
			TaskList,
			TaskItem,
			ImageKit.configure(),
			TableKit,
			Link,
			wrapProseMirrorPlugin(editorEventStatePlugin),
			...joplinEditablePlugin,
			markupTracker,
			wrapProseMirrorPlugin(searchPlugin),
		],
		content: await renderInitialMarkup(props.initialText),
	});
	editor.view.dispatch(
		setEditorEventHandler(editor.view.state.tr, props.onEvent),
	);
	editor.on('selectionUpdate', onUpdateSelection);
	editor.on('update', onDocumentUpdate);

	const editorControl: EditorControl = {
		supportsCommand: (name: EditorCommandType | string) => {
			return name in commands && !!commands[name as keyof typeof commands];
		},
		execCommand: (name: EditorCommandType | string, ..._args: unknown[]) => {
			if (!editorControl.supportsCommand(name)) {
				throw new Error(`Unsupported command: ${name}`);
			}

			commands[name as keyof typeof commands](editor);
		},
		undo: () => {
			void editorControl.execCommand(EditorCommandType.Undo);
		},
		redo: () => {
			void editorControl.execCommand(EditorCommandType.Redo);
		},
		select: function(anchor: number, head: number): void {
			const transaction = editor.view.state.tr;
			transaction.setSelection(
				TextSelection.create(transaction.doc, anchor, head),
			);
			editor.view.dispatch(transaction);
		},
		setScrollPercent: (fraction: number) => {
			// TODO: Handle this in a better way?
			document.scrollingElement.scrollTop = fraction * document.scrollingElement.scrollHeight;
		},
		insertText: (text: string, _source?: UserEventSource) => {
			editor.commands.insertContent(text);
		},
		updateBody: async (newBody: string, _updateBodyOptions?: UpdateBodyOptions) => {
			editor.commands.selectAll();
			editor.commands.insertContent(await renderInitialMarkup(newBody));
		},
		updateSettings: (newSettings: EditorSettings) => {
			settings = newSettings;
		},
		updateLink: (label: string, url: string) => {
			const selection = editor.state.selection;
			// Replace the selection with the new link text
			const transaction = editor.state.tr.insertText(label, selection.from, selection.to);
			editor.view.dispatch(
				// Ensure that the just-inserted content remains selected (if it was before)
				transaction.setSelection(
					TextSelection.create(
						transaction.doc,
						transaction.mapping.map(selection.from),
						transaction.mapping.map(selection.to),
					),
				),
			);
			editor.commands.setLink({ href: url });
		},
		setSearchState: (newState: SearchState) => {
			editor.view.dispatch(updateSearchState(editor.view.state, newState));
		},
		setContentScripts: function(_plugins: ContentScriptData[]): Promise<void> {
			throw new Error('Function not implemented.');
		},
	};
	return editorControl;
};

export default createEditor;
