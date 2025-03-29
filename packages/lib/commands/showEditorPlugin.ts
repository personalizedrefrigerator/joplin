import { CommandContext, CommandDeclaration, CommandRuntime } from '../services/CommandService';
import getActivePluginEditorView from '../services/plugins/utils/getActivePluginEditorView';
import Logger from '@joplin/utils/Logger';
import getActivePluginEditorViews from '../services/plugins/utils/getActivePluginEditorViews';

const logger = Logger.create('showEditorPlugin');

export const declaration: CommandDeclaration = {
	name: 'showEditorPlugin',
	label: () => 'Show editor plugin',
	iconName: 'fas fa-eye',
};

export const runtime = (): CommandRuntime => {
	return {
		execute: async (context: CommandContext, editorViewId = '', show = true) => {
			logger.info('View:', editorViewId, 'Show:', show);

			const pluginStates = context.state.pluginService.plugins;
			const windowId = context.state.windowId;
			if (!editorViewId) {
				const { editorPlugin, editorView } = getActivePluginEditorView(pluginStates, windowId);

				if (!editorPlugin) {
					logger.warn('No editor plugin to toggle to');
					return;
				}

				editorViewId = editorView.id;
			}

			const activePlugins = getActivePluginEditorViews(pluginStates, windowId);
			const editorPluginData = activePlugins.find(({ editorView }) => editorView.id === editorViewId);
			if (!editorPluginData) {
				logger.warn(`No editor view with ID ${editorViewId} is active.`);
				return;
			}
			const { editorView, editorPlugin } = editorPluginData;
			const previousVisible = editorView.visibleInWindows.includes(windowId);

			if (show && previousVisible) {
				logger.info(`Editor is already visible: ${editorViewId}`);
				return;
			} else if (!show && !previousVisible) {
				logger.info(`Editor is already hidden: ${editorViewId}`);
				return;
			}

			context.dispatch({
				type: 'PLUGIN_EDITOR_VIEW_SET_VISIBLE',
				pluginId: editorPlugin.id,
				viewId: editorView.id,
				visible: show,
			});

			// TODO -- save the currently visible ID set
			// Setting.setValue('plugins.shownEditorViewIds', shownEditorViewIds);
		},
	};
};
