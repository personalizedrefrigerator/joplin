import * as React from 'react';
import { useState, useEffect, useRef, forwardRef, useCallback, useImperativeHandle, useMemo, ForwardedRef } from 'react';

import { EditorCommand, NoteBodyEditorProps, NoteBodyEditorRef, OnChangeEvent } from '../../utils/types';
import { getResourcesFromPasteEvent } from '../../utils/resourceHandling';
import { ScrollOptions, ScrollOptionTypes } from '../../utils/types';
import Editor from './Editor';
import usePluginServiceRegistration from '../../utils/usePluginServiceRegistration';
import Setting from '@joplin/lib/models/Setting';
import Note from '@joplin/lib/models/Note';
import { _ } from '@joplin/lib/locale';
import shim from '@joplin/lib/shim';
import { MarkupToHtml } from '@joplin/renderer';
import { clipboard } from 'electron';
import ErrorBoundary from '../../../ErrorBoundary';
import { EditorCommandType, EditorControl, EditorKeymap, EditorLanguageType, EditorSettings, SearchState, UserEventSource } from '@joplin/editor/types';
import { EditorEvent, EditorEventType } from '@joplin/editor/events';
import Logger from '@joplin/utils/Logger';
import useEditorCommands from './useEditorCommands';
import CommandService from '@joplin/lib/services/CommandService';
import eventManager, { EventName, ResourceChangeEvent } from '@joplin/lib/eventManager';
import useSyncEditorValue from './utils/useSyncEditorValue';
import { themeStyle } from '@joplin/lib/theme';
import NewWindowOrIFrame, { WindowMode } from '../../../NewWindowOrIFrame';

const logger = Logger.create('ProseMirror');
const logDebug = (message: string) => logger.debug(message);


const CodeMirror = (props: NoteBodyEditorProps, ref: ForwardedRef<NoteBodyEditorRef>) => {

	const editorRef = useRef<EditorControl>(null);
	const rootRef = useRef(null);

	type OnChangeCallback = (event: OnChangeEvent)=> void;
	const props_onChangeRef = useRef<OnChangeCallback>(null);
	props_onChangeRef.current = props.onChange;

	const [selectionRange, setSelectionRange] = useState({ from: 0, to: 0 });

	usePluginServiceRegistration(ref);

	const lastChangeEventContentRef = useRef('');
	const onContentChange = useCallback((newBody: string) => {
		if (newBody !== props.content) {
			lastChangeEventContentRef.current = newBody;
			props_onChangeRef.current({ changeId: null, content: newBody });
		}
	}, [props.content]);

	const onEditorPaste = useCallback(async (event: Event|null = null) => {
		const resourceMds = await getResourcesFromPasteEvent(event);
		if (!resourceMds.length) return;
		if (editorRef.current) {
			editorRef.current.insertText(resourceMds.join('\n'), UserEventSource.Paste);
		}
	}, []);

	const editorPasteText = useCallback(async () => {
		if (editorRef.current) {
			const modifiedMd = await Note.replaceResourceExternalToInternalLinks(clipboard.readText(), { useAbsolutePaths: true });
			editorRef.current.insertText(modifiedMd, UserEventSource.Paste);
		}
	}, []);

	const editorPaste = useCallback(() => {
		const clipboardText = clipboard.readText();

		if (clipboardText) {
			void editorPasteText();
		} else {
			// To handle pasting images
			void onEditorPaste();
		}
	}, [editorPasteText, onEditorPaste]);

	const commands = useEditorCommands({
		editorRef,
		selectionRange,

		editorPaste,
		editorContent: props.content,
		visiblePanes: props.visiblePanes,
		contentMarkupLanguage: props.contentMarkupLanguage,
	});

	useImperativeHandle(ref, () => {
		return {
			content: () => props.content,
			resetScroll: () => {
			},
			scrollTo: (options: ScrollOptions) => {
				if (options.type === ScrollOptionTypes.Hash) {
					const hash: string = options.value;
					editorRef.current.execCommand(EditorCommandType.JumpToHash, hash);
				} else if (options.type === ScrollOptionTypes.Percent) {
					// TODO
				} else {
					throw new Error(`Unsupported scroll options: ${options.type}`);
				}
			},
			supportsCommand: (name: string) => {
				if (name === 'search' && !props.visiblePanes.includes('editor')) {
					return false;
				}
				return name in commands || editorRef.current.supportsCommand(name);
			},
			execCommand: async (cmd: EditorCommand) => {
				if (!editorRef.current) return false;

				logger.debug('execCommand', cmd);

				let commandOutput = null;
				if (cmd.name in commands) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
					commandOutput = (commands as any)[cmd.name](cmd.value);
				} else if (editorRef.current.supportsCommand(cmd.name)) {
					commandOutput = editorRef.current.execCommand(cmd.name);
				} else {
					logger.warn('unsupported Joplin command: ', cmd);
				}

				return commandOutput;
			},
		};
	}, [props.content, props.visiblePanes, commands]);

	useEffect(() => {
		const listener = (event: ResourceChangeEvent) => {
			editorRef.current?.onResourceChanged(event.id);
		};

		eventManager.on(EventName.ResourceChange, listener);
		return () => {
			eventManager.off(EventName.ResourceChange, listener);
		};
	}, [props.resourceInfos]);

	const lastSearchState = useRef<SearchState|null>(null);
	const onEditorEvent = useCallback((event: EditorEvent) => {
		if (event.kind === EditorEventType.Scroll) {
			// editor_scroll();
		} else if (event.kind === EditorEventType.Change) {
			onContentChange(event.value);
		} else if (event.kind === EditorEventType.SelectionRangeChange) {
			props.onCursorMotion({ markdown: event.from });
			setSelectionRange({ from: event.from, to: event.to });
		} else if (event.kind === EditorEventType.UpdateSearchDialog) {
			if (lastSearchState.current?.searchText !== event.searchState.searchText) {
				props.setLocalSearch(event.searchState.searchText);
			}

			if (lastSearchState.current?.dialogVisible !== event.searchState.dialogVisible) {
				props.setShowLocalSearch(event.searchState.dialogVisible);
			}
			lastSearchState.current = event.searchState;
		} else if (event.kind === EditorEventType.FollowLink) {
			void CommandService.instance().execute('openItem', event.link);
		}
	}, [onContentChange, props.setLocalSearch, props.setShowLocalSearch, props.onCursorMotion]);

	const onSelectPastBeginning = useCallback(() => {
		void CommandService.instance().execute('focusElement', 'noteTitle');
	}, []);

	const editorSettings = useMemo((): EditorSettings => {
		const isHTMLNote = props.contentMarkupLanguage === MarkupToHtml.MARKUP_LANGUAGE_HTML;

		let keyboardMode = EditorKeymap.Default;
		if (props.keyboardMode === 'vim') {
			keyboardMode = EditorKeymap.Vim;
		} else if (props.keyboardMode === 'emacs') {
			keyboardMode = EditorKeymap.Emacs;
		}

		return {
			language: isHTMLNote ? EditorLanguageType.Html : EditorLanguageType.Markdown,
			readOnly: props.disabled,
			markdownMarkEnabled: Setting.value('markdown.plugin.mark'),
			katexEnabled: Setting.value('markdown.plugin.katex'),
			inlineRenderingEnabled: Setting.value('editor.inlineRendering'),
			imageRenderingEnabled: Setting.value('editor.imageRendering'),
			highlightActiveLine: Setting.value('editor.highlightActiveLine'),
			themeData: {
				themeId: props.themeId,
				...themeStyle(props.themeId),
				marginLeft: 0,
				marginRight: 0,
				monospaceFont: Setting.value('style.editor.monospaceFontFamily'),
			},
			automatchBraces: Setting.value('editor.autoMatchingBraces'),
			autocompleteMarkup: Setting.value('editor.autocompleteMarkup'),
			useExternalSearch: false,
			ignoreModifiers: true,
			spellcheckEnabled: Setting.value('editor.spellcheckBeta'),
			keymap: keyboardMode,
			preferMacShortcuts: shim.isMac(),
			indentWithTabs: true,
			tabMovesFocus: props.tabMovesFocus,
			editorLabel: _('Markdown editor'),
		};
	}, [
		props.contentMarkupLanguage, props.disabled, props.keyboardMode, props.themeId,
		props.tabMovesFocus,
	]);

	const initialCursorLocationRef = useRef(0);
	initialCursorLocationRef.current = props.initialCursorLocation.markdown ?? 0;

	useSyncEditorValue({
		content: props.content,
		onMessage: props.onMessage,
		editorRef,
		noteId: props.noteId,
		initialCursorLocationRef,
		lastChangeEventContentRef,
	});

	const renderEditor = () => {
		return (
			<div className='editor'>
				<Editor
					style={{}}
					initialText={props.content}
					initialSelectionRef={initialCursorLocationRef}
					initialNoteId={props.noteId}
					ref={editorRef}
					settings={editorSettings}
					pluginStates={props.plugins}
					onPasteFile={null}
					onEvent={onEditorEvent}
					onLogMessage={logDebug}
					onEditorPaste={onEditorPaste}
					onSelectPastBeginning={onSelectPastBeginning}
					externalSearch={props.searchMarkers}
					useLocalSearch={props.useLocalSearch}
					markupToHtml={props.markupToHtml}
					onLocalize={_}
				/>
			</div>
		);
	};


	return (
		<ErrorBoundary message="The text editor encountered a fatal error and could not continue. The error might be due to a plugin, so please try to disable some of them and try again.">
			<div style={{}} ref={rootRef}>
				<NewWindowOrIFrame
					mode={WindowMode.Iframe}
					title='Rich Text Editor'
					windowId=''
					onClose={()=>{}}
				>
					{renderEditor()}
				</NewWindowOrIFrame>
			</div>
		</ErrorBoundary>
	);
};

export default forwardRef(CodeMirror);
