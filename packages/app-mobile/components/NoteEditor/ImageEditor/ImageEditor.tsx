const React = require('react');
import { _ } from '@joplin/lib/locale';
import Setting from '@joplin/lib/models/Setting';
import shim from '@joplin/lib/shim';
import { themeStyle } from '@joplin/lib/theme';
import { Theme } from '@joplin/lib/themes/type';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Alert, BackHandler } from 'react-native';
import { WebViewMessageEvent } from 'react-native-webview';
import ExtendedWebView from '../../ExtendedWebView';

type OnSaveCallback = (svgData: string)=> void;
type OnCancelCallback = ()=> void;

interface Props {
	themeId: number;
	initialSVGData: string;
	onSave: OnSaveCallback;
	onCancel: OnCancelCallback;
}

const useCss = (editorTheme: Theme) => {
	return useMemo(() => {
		return `
			:root .imageEditorContainer {
				--primary-background-color: ${editorTheme.backgroundColor};
				--primary-background-color-transparent: ${editorTheme.backgroundColorTransparent};
				--secondary-background-color: ${editorTheme.selectedColor2};
				--primary-foreground-color: ${editorTheme.color};
				--secondary-foreground-color: ${editorTheme.color2};

				width: 100vw;
				height: 100vh;
				box-sizing: border-box;
			}

			body, html {
				padding: 0;
				margin: 0;
			}
		`;
	}, [editorTheme]);
};

const ImageEditor = (props: Props) => {
	const editorTheme: Theme = themeStyle(props.themeId);
	const webviewRef = useRef(null);

	const onBackPress = useCallback(() => {
		Alert.alert(
			_('Save changes?'), _('This drawing may have unsaved changes.'), [
				{
					text: _('Discard changes'),
					onPress: () => props.onCancel(),
					style: 'destructive',
				},
				{
					text: _('Save changes'),
					onPress: () => {
						// saveDrawing calls props.onSave(...) which may close the
						// editor.
						webviewRef.current.injectJS('saveDrawing();');
					},
				},
			]
		);
		return true;
	}, [webviewRef, props.onCancel]);

	useEffect(() => {
		BackHandler.addEventListener('hardwareBackPress', onBackPress);

		return () => {
			BackHandler.removeEventListener('hardwareBackPress', onBackPress);
		};
	}, [onBackPress]);

	const css = useCss(editorTheme);
	const html = useMemo(() => `
		<!DOCTYPE html>
		<html>
			<head>
				<meta charset="utf-8"/>
				<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>

				<style>
					${css}
				</style>
			</head>
			<body></body>
		</html>
	`, [css]);

	const injectedJavaScript = useMemo(() => `
		window.onerror = (message, source, lineno) => {
			window.ReactNativeWebView.postMessage(
				"error: " + message + " in file://" + source + ", line " + lineno
			);
		};

		const saveDrawing = (isAutosave) => {
			const img = window.editor.toSVG();
			window.ReactNativeWebView.postMessage(
				JSON.stringify({
					action: isAutosave ? 'autosave' : 'save',
					data: img.outerHTML,
				}),
			);
		};
		window.saveDrawing = saveDrawing;

		try {
			if (window.editor === undefined) {
				${shim.injectedJs('svgEditorBundle')}

				window.editor = svgEditorBundle.createJsDrawEditor();

				window.initialSVGData = ${JSON.stringify(props.initialSVGData)};
				if (initialSVGData && initialSVGData.length > 0) {
					editor.loadFromSVG(initialSVGData);
				}

				const toolbar = editor.addToolbar();
				toolbar.addActionButton({
					label: ${JSON.stringify(_('Done'))},
					icon: editor.icons.makeSaveIcon(),
				}, () => {
					saveDrawing(false);
				});

				// Auto-save four minutes.
				const autoSaveInterval = 4 * 60 * 1000;
				setInterval(() => {
					saveDrawing(true);
				}, autoSaveInterval);
			}
		} catch(e) {
			window.ReactNativeWebView.postMessage(
				'error: ' + e.message + ': ' + JSON.stringify(e)
			);
		}
		true;
	`, [props.initialSVGData]);

	const onMessage = useCallback(async (event: WebViewMessageEvent) => {
		const data = event.nativeEvent.data;
		if (data.startsWith('error:')) {
			console.error('ImageEditor:', data);
			return;
		}

		const json = JSON.parse(data);
		if (json.action === 'save') {
			props.onSave(json.data);
		} else if (json.action === 'autosave') {
			const filePath = `${Setting.value('resourceDir')}/autosaved-drawing.joplin.svg`;
			await shim.fsDriver().writeFile(filePath, json.data, 'utf8');
			console.info('Auto-saved to %s', filePath);
		} else {
			console.error('Unknown action,', json.action);
		}
	}, [props.onSave]);

	const onError = useCallback((event: any) => {
		console.error('ImageEditor: WebView error: ', event);
	}, []);

	return (
		<ExtendedWebView
			themeId={props.themeId}
			html={html}
			injectedJavaScript={injectedJavaScript}
			onMessage={onMessage}
			onError={onError}
			ref={webviewRef}
			webviewInstanceId={'image-editor-js-draw'}
		/>
	);
};

export default ImageEditor;
