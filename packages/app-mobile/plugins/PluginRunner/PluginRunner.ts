import BasePluginRunner from '@joplin/lib/services/plugins/BasePluginRunner';
import PluginApiGlobal from '@joplin/lib/services/plugins/api/Global';
import Plugin from '@joplin/lib/services/plugins/Plugin';
import { WebViewControl } from '../../components/ExtendedWebView';
import { RefObject } from 'react';
import { WebViewMessageEvent } from 'react-native-webview';
import RNToWebViewMessenger from '../../utils/ipc/RNToWebViewMessenger';
import { PluginMainProcessApi, PluginWebViewApi } from './types';
import Logger from '@joplin/utils/Logger';
import createOnLogHander from './utils/createOnLogHandler';

const logger = Logger.create('PluginRunner');

type MessageEventListener = (plugin: Plugin, event: WebViewMessageEvent)=> boolean;
type OnAddRemovePluginListener = (plugin: Plugin)=>void;

export default class PluginRunner extends BasePluginRunner {
	private messageEventListeners: MessageEventListener[] = [];
	private pluginApis: Map<string, PluginApiGlobal> = new Map();
	private pluginMessengers: Map<string, RNToWebViewMessenger<PluginMainProcessApi, PluginWebViewApi>> = new Map();

	public constructor(
		private onAddPlugin: OnAddRemovePluginListener,
		private onRemovePlugin: OnAddRemovePluginListener,
	) {
		super();
	}

	public override async run(plugin: Plugin, pluginApi: PluginApiGlobal) {
		const pluginId = plugin.id;
		logger.info('Running plugin with id', pluginId);
		this.pluginApis.set(plugin.id, pluginApi);
		this.onAddPlugin(plugin);
	}

	public override async stop(plugin: Plugin) {
		if (!this.pluginMessengers.has(plugin.id)) {
			logger.debug('Plugin not running. Attempting to stop anyway. ID:', plugin.id);
		} else {
			const pluginMessenger = this.pluginMessengers.get(plugin.id);
			pluginMessenger.closeConnection();
			this.pluginMessengers.delete(plugin.id);
			this.pluginApis.delete(plugin.id);
		}
		logger.info('Stopping plugin with id', plugin.id);
		this.onRemovePlugin(plugin);
	}

	public registerWebView(plugin: Plugin, webviewRef: RefObject<WebViewControl>) {
		if (this.pluginMessengers.get(plugin.id)) return;

		const pluginLogger = Logger.create(`Plugin ${plugin.id}`);
		pluginLogger.debug('Registered webview for plugin', plugin.id);

		const onLog = createOnLogHander(plugin, pluginLogger);
		const onError = async (message: string) => {
			pluginLogger.error(message);
			plugin.hasErrors = true;
		};

		const pluginId = plugin.id;
		const pluginApi = this.pluginApis.get(pluginId);

		const messageChannelId = `plugin-message-channel-${pluginId}-${Date.now()}`;
		const messenger = new RNToWebViewMessenger<PluginMainProcessApi, PluginWebViewApi>(
			messageChannelId, webviewRef, { api: pluginApi, onError, onLog },
		);
		this.pluginMessengers.set(pluginId, messenger);

		this.messageEventListeners.push((sourcePlugin, event) => {
			if (sourcePlugin !== plugin) {
				return false;
			}

			if (!messenger.hasBeenClosed()) {
				console.log('onmessage', event.nativeEvent.data)
				messenger.onWebViewMessage(event);
				return true;
			}
			return false;
		});

		webviewRef.current.injectJS(`
			pluginBackgroundPage.runPlugin(
				${JSON.stringify(plugin.scriptText)},
				${JSON.stringify(messageChannelId)},
				${JSON.stringify(plugin.id)},
			);
		`);

		messenger.onWebViewLoaded();
	}

	public onWebviewMessage = (plugin: Plugin, event: WebViewMessageEvent) => {
		this.messageEventListeners = this.messageEventListeners.filter(
			// Remove all listeners that return false
			listener => listener(plugin, event),
		);
	};
}
