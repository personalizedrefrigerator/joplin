import * as React from 'react';
import { ForwardedRef, RefObject } from 'react';
import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { EditorProps, LogMessageCallback, OnEventCallback, EditorControl, EditorLanguageType } from '@joplin/editor/types';
import createEditor from '@joplin/editor/ProseMirror/createEditor';
import createMarkdownEditor from '@joplin/editor/CodeMirror/createEditor';
import { PluginStates } from '@joplin/lib/services/plugins/reducer';
import { SearchMarkers } from '../../utils/useSearchMarkers';
import useAsyncEffect from '@joplin/lib/hooks/useAsyncEffect';
import convertHtmlToMarkdown from '@joplin/lib/utils/convertHtmlToMarkdown';
import { MarkupLanguage } from '@joplin/renderer/types';
import { MarkupToHtmlHandler } from '../../utils/types';
import { _ } from '@joplin/lib/locale';
import { parseResourceUrl } from '@joplin/lib/urlUtils';
import getResourceBaseUrl from '../../utils/getResourceBaseUrl';
import { resourceFilename } from '@joplin/lib/models/utils/resourceUtils';
import Resource from '@joplin/lib/models/Resource';
import { EditorEventType } from '@joplin/editor/events';

interface Props extends EditorProps {
	style: React.CSSProperties;
	pluginStates: PluginStates;
	initialSelectionRef: RefObject<number>;

	markupToHtml: MarkupToHtmlHandler;
	onEditorPaste: (event: Event)=> void;
	externalSearch: SearchMarkers;
	useLocalSearch: boolean;
}

const Editor = (props: Props, ref: ForwardedRef<EditorControl>) => {
	const editorContainerRef = useRef<HTMLDivElement|null>(null);
	const [editor, setEditor] = useState<EditorControl|null>(null);

	// The editor will only be created once, so callbacks that could
	// change need to be stored as references.
	const onEventRef = useRef<OnEventCallback>(props.onEvent);
	const onLogMessageRef = useRef<LogMessageCallback>(props.onLogMessage);

	useEffect(() => {
		onEventRef.current = props.onEvent;
		onLogMessageRef.current = props.onLogMessage;
	}, [props.onEvent, props.onLogMessage]);

	useImperativeHandle(ref, () => {
		return editor;
	}, [editor]);

	const markupToHtmlRef = useRef(props.markupToHtml);
	markupToHtmlRef.current = props.markupToHtml;

	useAsyncEffect(async (event) => {
		if (!editorContainerRef.current) return;

		const editorProps: EditorProps = {
			...props,
			onEvent: event => onEventRef.current(event),
			onLogMessage: message => onLogMessageRef.current(message),
		};

		const editor = await createEditor(editorContainerRef.current, {
			...editorProps,
		}, {
			renderHtmlToMarkup: (html) => convertHtmlToMarkdown(html),
			renderMarkupToHtml: async (markup, options) => {
				let language = MarkupLanguage.Markdown;
				if (props.settings.language === EditorLanguageType.Html && !options.forceMarkdown) {
					language = MarkupLanguage.Html;
				}

				const result = await markupToHtmlRef.current(language, markup, {
					mapsToLine: true,
					externalAssetsOnly: false,
				});
				console.log('rendered', result);
				return result;
			},
		}, (parent, language, onChange) => {
			return createMarkdownEditor(parent, {
				...props,
				initialText: '',
				initialNoteId: '',
				settings: {
					...props.settings,
					language,
				},
				onEvent: (event) => {
					if (event.kind === EditorEventType.Change) {
						onChange(event.value);
					}
				},
				onLocalize: _,

				onPasteFile: (data) => {
					return props.onPasteFile(data);
				},
				resolveImageSrc: async (src, reloadCounter) => {
					const url = parseResourceUrl(src);
					if (!url.itemId) return null;
					const item = await Resource.load(url.itemId);
					if (!item) return null;
					return `${getResourceBaseUrl()}/${resourceFilename(item)}${reloadCounter ? `?r=${reloadCounter}` : ''}`;
				},
			});
		});
		setEditor(editor);

		event.onCleanup(() => {
			editor.remove();
		});
	// eslint-disable-next-line @seiyab/react-hooks/exhaustive-deps -- Should run just once
	}, []);

	useEffect(() => {
		editor?.updateSettings(props.settings);
	}, [props.settings, editor]);

	return (
		<div
			className='ProseMirror'
			style={props.style}
			ref={editorContainerRef}
		></div>
	);
};

export default forwardRef(Editor);
