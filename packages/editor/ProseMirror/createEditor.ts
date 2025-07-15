import { ContentScriptData, EditorCommandType, EditorControl, EditorProps, EditorSettings, SearchState, UpdateBodyOptions, UserEventSource } from '../types';
import { EditorState, TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { DOMSerializer as ProseMirrorDomSerializer, DOMParser as ProseMirrorDomParser } from 'prosemirror-model';
import { history } from 'prosemirror-history';
import commands from './commands';
import schema from './schema';
import { gapCursor } from 'prosemirror-gapcursor';
import { dropCursor } from 'prosemirror-dropcursor';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';
import { EditorEventType } from '../events';
import { RenderResult } from '../../renderer/types';
import UndoStackSynchronizer from './utils/UndoStackSynchronizer';

type MarkupToHtml = (markup: string)=> Promise<RenderResult>;
type HtmlToMarkup = (html: HTMLElement)=> string;

const createEditor = async (
	parentElement: HTMLElement,
	props: EditorProps,
	renderToHtml: MarkupToHtml,
	renderToMarkup: HtmlToMarkup,
): Promise<EditorControl> => {
	const proseMirrorParser = ProseMirrorDomParser.fromSchema(schema);
	const proseMirrorSerializer = ProseMirrorDomSerializer.fromSchema(schema);

	const cssContainer = document.createElement('style');
	parentElement.appendChild(cssContainer);

	const createInitialState = async (markup: string) => {
		const renderResult = await renderToHtml(markup);
		cssContainer.replaceChildren(
			document.createTextNode(renderResult.cssStrings.join('\n')),
		);

		const dom = new DOMParser().parseFromString(renderResult.html, 'text/html');

		return EditorState.create({
			doc: proseMirrorParser.parse(dom),
			plugins: [
				keymap(baseKeymap),
				gapCursor(),
				dropCursor(),
				history(),
			],
		});
	};

	const undoStackSynchronizer = new UndoStackSynchronizer(props.onEvent);

	const view = new EditorView(parentElement, {
		state: await createInitialState(props.initialText),
		dispatchTransaction: transaction => {
			if (transaction.docChanged) {
				const finalDoc = proseMirrorSerializer.serializeFragment(transaction.doc.content);
				const element = document.createElement('div');
				element.appendChild(finalDoc);

				props.onEvent({
					kind: EditorEventType.Change,
					value: renderToMarkup(element),
				});
			}

			undoStackSynchronizer.schedulePostUndoRedoDepthChange(view);

			view.updateState(view.state.apply(transaction));
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

			// TODO: Dispatch related event
		},
		redo: () => {
			void editorControl.execCommand(EditorCommandType.Redo);

			// TODO: Dispatch related event
		},
		select: function(anchor: number, head: number): void {
			const transaction = view.state.tr;
			transaction.setSelection(
				TextSelection.create(transaction.doc, anchor, head),
			);
			view.dispatch(transaction);
		},
		setScrollPercent: (_fraction: number) => {
			throw new Error('setScrollPercent: not implemented');
		},
		insertText: (text: string, _source?: UserEventSource) => {
			view.dispatch(view.state.tr.insertText(text));
		},
		updateBody: async (newBody: string, _updateBodyOptions?: UpdateBodyOptions) => {
			view.updateState(await createInitialState(newBody));
		},
		updateSettings: function(_newSettings: EditorSettings): void {
			// throw new Error("Function not implemented.");
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
