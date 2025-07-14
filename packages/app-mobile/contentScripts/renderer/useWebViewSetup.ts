import { RefObject, useMemo, useRef } from 'react';
import shim from '@joplin/lib/shim';
import Setting from '@joplin/lib/models/Setting';
import { Platform } from 'react-native';
import { SetUpResult } from '../types';
import { themeStyle } from '../../components/global-style';
import Logger from '@joplin/utils/Logger';
import { WebViewControl } from '../../components/ExtendedWebView/types';
import { MainProcessApi, OnScrollCallback, RendererProcessApi, RendererWebViewOptions } from './types';
import PluginService from '@joplin/lib/services/plugins/PluginService';
import RNToWebViewMessenger from '../../utils/ipc/RNToWebViewMessenger';
import useEditPopup from './utils/useEditPopup';
import { PluginStates } from '@joplin/lib/services/plugins/reducer';

const logger = Logger.create('renderer/useWebViewSetup');

interface Props {
	webviewRef: RefObject<WebViewControl>;
	onScroll: OnScrollCallback;
	onPostMessage: (message: string)=> void;
	pluginStates: PluginStates;

	themeId: number;
	tempDir: string;
}

const useSource = (tempDirPath: string, themeId: number) => {
	const { editPopupCss } = useEditPopup(themeId);

	const injectedJs = useMemo(() => {
		const subValues = Setting.subValues('markdown.plugin', Setting.toPlainObject());
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		const pluginOptions: any = {};
		for (const n in subValues) {
			pluginOptions[n] = { enabled: subValues[n] };
		}

		const rendererWebViewOptions: RendererWebViewOptions = {
			settings: {
				safeMode: Setting.value('isSafeMode'),
				tempDir: tempDirPath,
				resourceDir: Setting.value('resourceDir'),
				resourceDownloadMode: Setting.value('sync.resourceDownloadMode'),
			},
			// Web needs files to be transferred manually, since image SRCs can't reference
			// the Origin Private File System.
			useTransferredFiles: Platform.OS === 'web',
			pluginOptions,
		};

		return `
			if (!window.rendererJsLoaded) {
				window.rendererJsLoaded = true;

				${shim.injectedJs('webviewLib')}
				${shim.injectedJs('rendererBundle')}

				rendererBundle.initializeForFullPageRendering(${JSON.stringify(rendererWebViewOptions)});
			}
		`;
	}, [tempDirPath]);

	const [paddingLeft, paddingRight] = useMemo(() => {
		const theme = themeStyle(themeId);
		return [theme.marginLeft, theme.marginRight];
	}, [themeId]);

	const css = useMemo(() => {
		// iOS doesn't automatically adjust the WebView's font size to match users'
		// accessibility settings. To do this, we need to tell it to match the system font.
		// See https://github.com/ionic-team/capacitor/issues/2748#issuecomment-612923135
		const iOSSpecificCss = `
			@media screen {
				:root body {
					font: -apple-system-body;
				}
			}
		`;
		const defaultCss = `
			code {
				white-space: pre-wrap;
				overflow-x: hidden;
			}

			body {
				padding-left: ${Number(paddingLeft)}px;
				padding-right: ${Number(paddingRight)}px;
			}

			${editPopupCss}
		`;

		return [defaultCss, iOSSpecificCss].join('\n\n');
	}, [paddingLeft, paddingRight, editPopupCss]);

	return { css, injectedJs };
};

const onPostPluginMessage = async (contentScriptId: string, message: unknown) => {
	logger.debug(`Handling message from content script: ${contentScriptId}:`, message);

	const pluginService = PluginService.instance();
	const pluginId = pluginService.pluginIdByContentScriptId(contentScriptId);
	if (!pluginId) {
		throw new Error(`Plugin not found for content script with ID ${contentScriptId}`);
	}

	const plugin = pluginService.pluginById(pluginId);
	return plugin.emitContentScriptMessage(contentScriptId, message);
};

const useMessenger = (props: Props) => {
	const onScrollRef = useRef(props.onScroll);
	onScrollRef.current = props.onScroll;

	const onPostMessageRef = useRef(props.onPostMessage);
	onPostMessageRef.current = props.onPostMessage;

	const messenger = useMemo(() => {
		const fsDriver = shim.fsDriver();
		const localApi = {
			onScroll: (fraction: number) => onScrollRef.current?.(fraction),
			onPostMessage: (message: string) => onPostMessageRef.current?.(message),
			onPostPluginMessage,
			fsDriver: {
				writeFile: async (path: string, content: string, encoding?: string) => {
					if (!await fsDriver.exists(props.tempDir)) {
						await fsDriver.mkdir(props.tempDir);
					}
					// To avoid giving the WebView access to the entire main tempDir,
					// we use props.tempDir (which should be different).
					path = fsDriver.resolveRelativePathWithinDir(props.tempDir, path);
					return await fsDriver.writeFile(path, content, encoding);
				},
				exists: fsDriver.exists,
				cacheCssToFile: fsDriver.cacheCssToFile,
			},
		};
		return new RNToWebViewMessenger<MainProcessApi, RendererProcessApi>(
			'renderer', props.webviewRef, localApi,
		);
	}, [props.webviewRef, props.tempDir]);

	return messenger;
};

const useWebViewSetup = (props: Props): SetUpResult<RendererProcessApi> => {
	const { css, injectedJs } = useSource(props.tempDir, props.themeId);
	const messenger = useMessenger(props);

	return useMemo(() => {
		return {
			api: messenger.remoteApi,
			pageSetup: { css, js: injectedJs },
			webViewEventHandlers: {
				onLoadEnd: messenger.onWebViewLoaded,
				onMessage: messenger.onWebViewMessage,
			},
		};
	}, [css, injectedJs, messenger]);
};

export default useWebViewSetup;
