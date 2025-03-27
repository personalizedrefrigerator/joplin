import { useMemo, RefObject } from 'react';
import { DialogMainProcessApi, DialogWebViewApi } from '../../types';
import Logger from '@joplin/utils/Logger';
import { WebViewControl } from '../../../ExtendedWebView/types';
import createOnLogHander from '../../utils/createOnLogHandler';
import RNToWebViewMessenger from '../../../../utils/ipc/RNToWebViewMessenger';
import { SerializableData } from '@joplin/lib/utils/ipc/types';
import PostMessageService, { ResponderComponentType } from '@joplin/lib/services/PostMessageService';
import PluginService from '@joplin/lib/services/plugins/PluginService';
import { defaultWindowId } from '@joplin/lib/reducer';

interface Props {
	pluginId: string;
	viewId: string;
	webviewRef: RefObject<WebViewControl>;
	messageChannelId: string;
}

const useDialogMessenger = (props: Props) => {
	const { pluginId, webviewRef, viewId, messageChannelId } = props;

	return useMemo(() => {
		const plugin = PluginService.instance().pluginById(pluginId);
		const logger = Logger.create(`PluginDialogWebView(${pluginId})`);

		const dialogApi: DialogMainProcessApi = {
			postMessage: async (message: SerializableData) => {
				return await plugin.viewController(viewId).emitMessage({ message });
			},
			onMessage: async (callback) => {
				const windowId = defaultWindowId;
				PostMessageService.instance().registerViewMessageHandler(
					ResponderComponentType.UserWebview,
					viewId,
					windowId,
					(message: SerializableData) => {
						// For compatibility with desktop, the message needs to be wrapped in
						// an object.
						return callback({ message });
					},
				);
			},
			onError: async (error: string) => {
				logger.error(`Unhandled error: ${error}`);
				plugin.hasErrors = true;
			},
			onLog: createOnLogHander(plugin, logger),
		};

		return new RNToWebViewMessenger<DialogMainProcessApi, DialogWebViewApi>(
			messageChannelId, webviewRef, dialogApi,
		);
	}, [webviewRef, pluginId, viewId, messageChannelId]);
};

export default useDialogMessenger;
