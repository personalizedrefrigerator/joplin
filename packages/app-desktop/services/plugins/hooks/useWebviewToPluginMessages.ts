import PostMessageService, { MessageResponse, ResponderComponentType } from '@joplin/lib/services/PostMessageService';
import { RefObject, useEffect } from 'react';
import bridge from '../../bridge';
import CommandService from '@joplin/lib/services/CommandService';
import { MenuItemConstructorOptions } from 'electron';
import { MenuTemplateItem } from '@joplin/lib/services/plugins/api/types';

// eslint-disable-next-line @typescript-eslint/ban-types -- Old code before rule was applied, Old code before rule was applied
export default function(webviewRef: RefObject<HTMLIFrameElement>, isReady: boolean, pluginId: string, viewId: string, windowId: string, postMessage: Function) {
	useEffect(() => {
		PostMessageService.instance().registerResponder(ResponderComponentType.UserWebview, viewId, windowId, (message: MessageResponse) => {
			postMessage('postMessageService.response', { message });
		});

		return () => {
			PostMessageService.instance().unregisterResponder(ResponderComponentType.UserWebview, viewId, windowId);
		};
		// eslint-disable-next-line @seiyab/react-hooks/exhaustive-deps -- Old code before rule was applied
	}, [viewId]);

	useEffect(() => {
		function onMessage_(event: MessageEvent) {
			if (!event.data || event.source !== webviewRef.current.contentWindow) {
				return;
			}

			if (event.data.target === 'postMessageService.registerViewMessageHandler') {
				PostMessageService.instance().registerViewMessageHandler(
					ResponderComponentType.UserWebview,
					viewId,
					(message: MessageResponse) => {
						postMessage('postMessageService.plugin_message', { message });
					},
				);
			} else if (event.data.target === 'postMessageService.message') {
				void PostMessageService.instance().postMessage({
					pluginId,
					viewId,
					windowId,
					...event.data.message,
				});
			} else if (event.data.target === 'webviewApi.menuPopupFromTemplate') {
				const template = event.data.args as MenuTemplateItem[];
				const finalTemplate = template.map((menuItem) => {
					const output: MenuItemConstructorOptions = {
						label: menuItem.label ?? '',
						click: () => {
							const args = menuItem.commandArgs ?? [];
							void CommandService.instance().execute(menuItem.command, ...args);
						},
					};
					return output;
				});
				bridge().menuPopupFromTemplate(finalTemplate);
			}
		}

		const containerWindow = (webviewRef.current.getRootNode() as Document).defaultView;
		containerWindow.addEventListener('message', onMessage_);

		return () => {
			containerWindow.removeEventListener('message', onMessage_);
		};
	}, [webviewRef, isReady, pluginId, windowId, viewId, postMessage]);
}
