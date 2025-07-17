import { themeStyle } from '@joplin/lib/theme';
import themeToCss from '@joplin/lib/services/style/themeToCss';
import ExtendedWebView from '../ExtendedWebView';

import * as React from 'react';
import { useMemo, useCallback, useRef } from 'react';
import { NativeSyntheticEvent } from 'react-native';

import { EditorProps } from './types';
import { _ } from '@joplin/lib/locale';
import { WebViewErrorEvent } from 'react-native-webview/lib/RNCWebViewNativeComponent';
import Logger from '@joplin/utils/Logger';
import { OnMessageEvent } from '../ExtendedWebView/types';
import useWebViewSetup from '../../contentScripts/richTextEditorBundle/useWebViewSetup';
import CommandService from '@joplin/lib/services/CommandService';
import shim from '@joplin/lib/shim';

const logger = Logger.create('NoteEditor');

function useCss(themeId: number, editorCss: string): string {
	return useMemo(() => {
		const theme = themeStyle(themeId);
		const themeVariableCss = themeToCss(theme);
		return `
			${themeVariableCss}
			${editorCss}

			:root {
				background-color: ${theme.backgroundColor};
			}

			body {
				margin: 0;
				height: 100vh;
				/* Prefer 100% -- 100vw shows an unnecessary horizontal scrollbar in Google Chrome (desktop). */
				width: 100%;
				box-sizing: border-box;

				padding-left: 4px;
				padding-right: 4px;
				padding-bottom: 1px;
				padding-top: 10px;

				font-size: 13pt;
				font-family: ${JSON.stringify(theme.fontFamily)}, sans-serif;
			}

			* {
				scrollbar-width: thin;
				scrollbar-color: rgba(100, 100, 100, 0.7) rgba(0, 0, 0, 0.1);
			}

			@supports selector(::-webkit-scrollbar) {
				*::-webkit-scrollbar {
					width: 7px;
					height: 7px;
				}

				*::-webkit-scrollbar-corner {
					background: none;
				}

				*::-webkit-scrollbar-track {
					border: none;
				}

				*::-webkit-scrollbar-thumb {
					background: rgba(100, 100, 100, 0.3);
					border-radius: 5px;
				}

				*::-webkit-scrollbar-track:hover {
					background: rgba(0, 0, 0, 0.1);
				}

				*::-webkit-scrollbar-thumb:hover {
					background: rgba(100, 100, 100, 0.7);
				}

				* {
					scrollbar-width: unset;
					scrollbar-color: unset;
				}
			}
		`;
	}, [themeId, editorCss]);
}

function useHtml(initialCss: string): string {
	const cssRef = useRef(initialCss);
	cssRef.current = initialCss;

	return useMemo(() => `
		<!DOCTYPE html>
		<html>
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
				<title>${_('Note editor')}</title>
				<style>
					/* For better scrolling on iOS (working scrollbar) we use external, rather than internal,
						scrolling. */
					.cm-scroller {
						overflow: none;
					}
				</style>
			</head>
			<body>
				<div class="RichTextEditor" style="height:100%;" autocapitalize="on"></div>
			</body>
		</html>
	`, []);
}

const onPostMessage = async (message: string) => {
	try {
		await CommandService.instance().execute('openItem', message);
	} catch (error) {
		void shim.showErrorDialog(`postMessage failed: ${message}`);
	}
};

const RichTextEditor: React.FC<EditorProps> = props => {
	const webviewRef = props.webviewRef;

	const editorWebViewSetup = useWebViewSetup({
		parentElementClassName: 'RichTextEditor',
		onEditorEvent: props.onEditorEvent,
		initialText: props.initialText,
		noteId: props.noteId,
		settings: props.editorSettings,
		webviewRef,
		themeId: props.themeId,
		pluginStates: props.plugins,
		noteResources: props.noteResources,
		onPostMessage: onPostMessage,
	});

	props.editorRef.current = editorWebViewSetup.api;

	const injectedJavaScript = `
		window.onerror = (message, source, lineno) => {
			console.error(message);
			window.ReactNativeWebView.postMessage(
				"error: " + message + " in file://" + source + ", line " + lineno
			);
		};
		window.onunhandledrejection = (event) => {
			window.ReactNativeWebView.postMessage(
				"error: Unhandled promise rejection: " + event
			);
		};
		
		try {
			${editorWebViewSetup.pageSetup.js}
		} catch (e) {
			console.error('Setup error: ', e);
			window.ReactNativeWebView.postMessage("error:" + e.message + ": " + JSON.stringify(e))
		}

		true;
	`;

	const css = useCss(props.themeId, editorWebViewSetup.pageSetup.css);
	const html = useHtml(css);

	const onMessage = useCallback((event: OnMessageEvent) => {
		const data = event.nativeEvent.data;

		if (typeof data === 'string' && data.indexOf('error:') === 0) {
			logger.error('CodeMirror error', data);
			return;
		}

		editorWebViewSetup.webViewEventHandlers.onMessage(event);
	}, [editorWebViewSetup]);

	const onError = useCallback((event: NativeSyntheticEvent<WebViewErrorEvent>) => {
		logger.error(`Load error: Code ${event.nativeEvent.code}: ${event.nativeEvent.description}`);
	}, []);

	return (
		<ExtendedWebView
			ref={webviewRef}
			webviewInstanceId='MarkdownEditor'
			testID='MarkdownEditor'
			scrollEnabled={true}
			html={html}
			injectedJavaScript={injectedJavaScript}
			css={css}
			hasPluginScripts={false}
			onMessage={onMessage}
			onLoadEnd={editorWebViewSetup.webViewEventHandlers.onLoadEnd}
			onError={onError}
		/>
	);
};

export default RichTextEditor;
