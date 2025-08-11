import { Editor } from '@tiptap/core';
import DocumentNode from '@tiptap/extension-document';
import TextNode from '@tiptap/extension-text';
import { Focus, UndoRedo, Dropcursor, Gapcursor } from '@tiptap/extensions';
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
import { BulletList, ListItem, OrderedList, TaskItem, TaskList } from '@tiptap/extension-list';
import { TextSelection, Transaction } from '@tiptap/pm/state';
import wrapProseMirrorPlugins from './utils/wrapProseMirrorPlugins';
import joplinEditablePlugin from './plugins/joplinEditablePlugin/joplinEditablePlugin';
import Link from '@tiptap/extension-link';
import { RendererControl } from './types';

import joplinEditorApiPlugin, { setEditorApi } from './plugins/joplinEditorApiPlugin';
import linkTooltipPlugin from './plugins/linkTooltipPlugin';
import resourcePlaceholderPlugin, { onResourceDownloaded } from './plugins/resourcePlaceholderPlugin';
import HardBreak from '@tiptap/extension-hard-break';
import keymapPlugin from './plugins/keymapPlugin';
import searchPlugin from './plugins/searchPlugin';
import getFileFromPasteEvent from '../utils/getFileFromPasteEvent';
import Code from '@tiptap/extension-code';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import SubScript from '@tiptap/extension-subscript';
import SuperScript from '@tiptap/extension-superscript';
import BlockQuote from '@tiptap/extension-blockquote';
import Heading from '@tiptap/extension-heading';
import Highlight from '@tiptap/extension-highlight';
import Paragraph from '@tiptap/extension-paragraph';

const createEditor = async (
	parentElement: HTMLElement,
	props: EditorProps,
	renderer: RendererControl,
): Promise<EditorControl> => {
	const renderNodeToMarkup = (node: Node|DocumentFragment) => {
		return renderer.renderHtmlToMarkup(node);
	};

	const cssContainer = document.createElement('style');
	parentElement.appendChild(cssContainer);

	const { plugin: markupTracker, stateToMarkup } = originalMarkupPlugin(renderNodeToMarkup);
	const { plugin: searchExtension, updateState: updateSearchState } = searchPlugin(props.onEvent);

	let settings = props.settings;
	const renderAndPostprocessHtml = async (markup: string) => {
		const renderResult = await renderer.renderMarkupToHtml(markup, {
			forceMarkdown: false,
			isFullPageRender: true,
		});

		const dom = new DOMParser().parseFromString(renderResult.html, 'text/html');
		preprocessEditorInput(dom, markup);

		return {
			renderResult,
			dom,
			getHtmlString: () => {
				return new XMLSerializer().serializeToString(dom.body);
			},
		};
	};
	const updateGlobalCss = (renderResult: RenderResult) => {
		cssContainer.replaceChildren(
			document.createTextNode(renderResult.cssStrings.join('\n')),
		);
	};
	const renderInitialHtml = async (markup: string) => {
		const rendered = await renderAndPostprocessHtml(markup);
		updateGlobalCss(rendered.renderResult);
		return rendered.getHtmlString();
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
		const selectionFormatting = computeSelectionFormatting(transaction.doc, transaction.selection, editor.state, editor.schema, settings);
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
			keymapPlugin,
			joplinEditablePlugin,
			wrapProseMirrorPlugins([
				searchExtension,
			]),
			DocumentNode,
			TextNode,
			Paragraph,
			Focus,
			UndoRedo,
			Gapcursor,
			Dropcursor,
			Code.configure({
				HTMLAttributes: { class: 'inline-code' },
			}),
			TaskList,
			TaskItem,
			BulletList,
			OrderedList,
			ListItem,
			ImageKit.configure(),
			TableKit,
			HardBreak,
			Bold,
			Italic,
			BlockQuote,
			SubScript,
			SuperScript,
			Heading,
			Highlight,
			Link.configure({ openOnClick: false }),
			markupTracker,
			wrapProseMirrorPlugins([
				resourcePlaceholderPlugin,
				linkTooltipPlugin,
				joplinEditorApiPlugin,
			]),
		].flat(),
		editorProps: {
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
		},
		content: await renderInitialHtml(props.initialText),
	});
	editor.view.dispatch(
		setEditorApi(editor.view.state.tr, {
			onEvent: props.onEvent,
			localize: props.onLocalize,
			renderer: renderer,
		}),
	);
	editor.on('selectionUpdate', onUpdateSelection);
	editor.on('update', onDocumentUpdate);

	const editorControl: EditorControl = {
		supportsCommand: (name: EditorCommandType | string) => {
			return name in commands && !!commands[name as keyof typeof commands];
		},
		execCommand: (name: EditorCommandType | string, ...args: string[]) => {
			if (!editorControl.supportsCommand(name)) {
				throw new Error(`Unsupported command: ${name}`);
			}

			commands[name as keyof typeof commands](editor, args);
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
			editor.commands.insertContent(renderInitialHtml(newBody));
		},
		updateSettings: async (newSettings: EditorSettings) => {
			const oldSettings = settings;
			settings = newSettings;

			if (oldSettings.themeData.themeId !== newSettings.themeData.themeId) {
				// Refresh global CSS when the theme changes -- render the full document
				// to avoid required CSS being omitted due to missing markup.
				const { renderResult } = await renderAndPostprocessHtml(stateToMarkup(editor.view.state));
				updateGlobalCss(renderResult);
			}
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
		setContentScripts: (_plugins: ContentScriptData[]) => {
			throw new Error('setContentScripts not implemented.');
		},
		onResourceDownloaded: async (resourceId) => {
			const rendered = await renderAndPostprocessHtml(`<img src=":/${resourceId}"/>`);
			const renderedImage = rendered.dom.querySelector('img');

			// The resource might not be an image. If so, skip.
			if (!renderedImage) {
				return;
			}
			const stillNotLoaded = renderedImage.classList.contains('not-loaded-resource');
			if (stillNotLoaded) {
				return;
			}

			const resourceSrc = renderedImage?.src;
			onResourceDownloaded(editor.view, resourceId, resourceSrc);
		},
	};
	return editorControl;
};

export default createEditor;
