import BasePluginRunner from '@joplin/lib/services/plugins/BasePluginRunner';
import PluginApiGlobal from '@joplin/lib/services/plugins/api/Global';
import Plugin from '@joplin/lib/services/plugins/Plugin';
import { WebViewControl } from '../ExtendedWebView/types';
import { RefObject } from 'react';
import RNToWebViewMessenger from '../../utils/ipc/RNToWebViewMessenger';
import { PluginMainProcessApi, PluginWebViewApi, ReadFileBlobResult, ReadFileMethod } from './types';
import shim from '@joplin/lib/shim';
import Logger from '@joplin/utils/Logger';
import createOnLogHander from './utils/createOnLogHandler';
import { OnMessageEvent } from '../ExtendedWebView/types';
import { PermissionsAndroid, Platform } from 'react-native';
import createRecordingSessionManager from './backgroundPage/utils/createRecordingSessionManager';

const logger = Logger.create('PluginRunner');

type MessageEventListener = (event: OnMessageEvent)=> boolean;

export default class PluginRunner extends BasePluginRunner {
	private messageEventListeners: MessageEventListener[] = [];

	public constructor(private webviewRef: RefObject<WebViewControl>) {
		super();
	}

	public override async run(plugin: Plugin, pluginApi: PluginApiGlobal) {
		const pluginId = plugin.id;
		logger.info('Running plugin with id', pluginId);

		const pluginLogger = Logger.create(`Plugin ${plugin.id}`);

		const onLog = createOnLogHander(plugin, pluginLogger);
		const onError = async (message: string) => {
			pluginLogger.error(message);
			plugin.hasErrors = true;
		};
		const readFileBlob = async (rawPath: string): Promise<ReadFileBlobResult> => {
			const pluginBaseDir = plugin.dataDir;
			if (!await shim.fsDriver().exists(pluginBaseDir)) {
				return { kind: ReadFileMethod.Disallow };
			}

			// Only allow plugins to read files within the pluginBaseDIr
			const absolutePath = shim.fsDriver().resolveRelativePathWithinDir(pluginBaseDir, rawPath);
			if (shim.mobilePlatform() === 'web') {
				// On web,
				// 1. `readFile` supports reading as a Buffer,
				// 2. Sending large `Buffer`s over IPC isn't slow, and
				// 3. `fetch` from within the WebView can't be used to request virtual files.
				const buffer = await shim.fsDriver().readFile(absolutePath, 'Buffer');
				return new Blob([buffer]);
			} else {
				return {
					kind: ReadFileMethod.XmlHttpRequest,
					url: absolutePath,
				};
			}
		};

		// On web, recording sessions need to be made in the toplevel context (due to iframe
		// sandboxing):
		const recordingSessionManager = (Platform.OS === 'web' ? createRecordingSessionManager(()=>null) : null);
		const getRecordingSession = recordingSessionManager?.getAudioRecorder ?? (async () => {
			if (Platform.OS === 'android') {
				// Request permission, but don't return a recorder. For performance reasons (and to simplify code),
				// the recorder is created within the WebView.
				await PermissionsAndroid.request('android.permission.RECORD_AUDIO');
			}
			return null;
		});

		const messageChannelId = `plugin-message-channel-${pluginId}-${Date.now()}`;
		const messenger = new RNToWebViewMessenger<PluginMainProcessApi, PluginWebViewApi>(
			messageChannelId, this.webviewRef, { api: pluginApi, onError, onLog, readFileBlob, getRecordingSession },
		);

		this.messageEventListeners.push((event) => {
			if (!messenger.hasBeenClosed()) {
				messenger.onWebViewMessage(event);
				return true;
			}
			return false;
		});

		this.webviewRef.current.injectJS(`
			pluginBackgroundPage.runPlugin(
				${JSON.stringify(shim.injectedJs('pluginBackgroundPage'))},
				${JSON.stringify(plugin.scriptText)},
				${JSON.stringify(messageChannelId)},
				${JSON.stringify(plugin.id)},
			);
		`);

		messenger.onWebViewLoaded();
	}

	public override async stop(plugin: Plugin) {
		logger.info('Stopping plugin with id', plugin.id);

		if (!this.webviewRef.current) {
			logger.debug('WebView already unloaded. Plugin already stopped. ID: ', plugin.id);
			return;
		}

		this.webviewRef.current.injectJS(`
			pluginBackgroundPage.stopPlugin(${JSON.stringify(plugin.id)});
		`);
	}

	public onWebviewMessage = (event: OnMessageEvent) => {
		this.messageEventListeners = this.messageEventListeners.filter(
			// Remove all listeners that return false
			listener => listener(event),
		);
	};
}
