import { RefObject, useEffect, useMemo, useRef } from 'react';
import { WebViewControl } from '../../components/ExtendedWebView/types';
import { SetUpResult } from '../types';
import { EditorControl, EditorSettings } from '@joplin/editor/types';
import RNToWebViewMessenger from '../../utils/ipc/RNToWebViewMessenger';
import { EditorProcessApi, EditorProps, MainProcessApi } from './types';
import { EditorEvent } from '@joplin/editor/events';
import Logger from '@joplin/utils/Logger';
import shim from '@joplin/lib/shim';

const logger = Logger.create('useWebViewSetup');

interface Props {
	initialText: string;
	noteId: string;
	settings: EditorSettings;
	parentElementClassName: string;
	onEditorEvent: (event: EditorEvent)=> void;
	webviewRef: RefObject<WebViewControl>;
}

const useMessenger = (props: Props) => {
	const onEditorEventRef = useRef(props.onEditorEvent);
	onEditorEventRef.current = props.onEditorEvent;

	return useMemo(() => {
		const api: MainProcessApi = {
			onEditorEvent: (event: EditorEvent) => {
				onEditorEventRef.current(event);
				return Promise.resolve();
			},
			logMessage: (message: string) => {
				logger.info(message);
				return Promise.resolve();
			},
		};

		const messenger = new RNToWebViewMessenger<MainProcessApi, EditorProcessApi>(
			'rich-text-editor',
			props.webviewRef,
			api,
		);
		return messenger;
	}, [props.webviewRef]);
};

const useSource = (props: Props) => {
	const propsRef = useRef(props);
	propsRef.current = props;

	return useMemo(() => {
		const editorOptions: EditorProps = {
			parentElementClassName: propsRef.current.parentElementClassName,
			initialText: propsRef.current.initialText,
			initialNoteId: propsRef.current.noteId,
			settings: propsRef.current.settings,
		};

		return {
			css: '',
			js: `
				if (!window.richTextEditorCreated) {
					window.richTextEditorCreated = true;
					${shim.injectedJs('richTextEditorBundle')}
					richTextEditorBundle.setUpLogger();
					void richTextEditorBundle.initialize(${JSON.stringify(editorOptions)});
				}
			`,
		};
	}, []);
};

const useWebViewSetup = (props: Props): SetUpResult<EditorControl> => {
	const messenger = useMessenger(props);
	const pageSetup = useSource(props);

	useEffect(() => {
		void messenger.remoteApi.editor.updateSettings(props.settings);
	}, [props.settings, messenger]);

	return useMemo(() => {
		return {
			api: messenger.remoteApi.editor,
			pageSetup: pageSetup,
			webViewEventHandlers: {
				onLoadEnd: messenger.onWebViewLoaded,
				onMessage: messenger.onWebViewMessage,
			},
		};
	}, [messenger, pageSetup]);
};

export default useWebViewSetup;
