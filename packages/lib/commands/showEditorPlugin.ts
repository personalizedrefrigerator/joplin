import { CommandContext, CommandDeclaration, CommandRuntime } from '../services/CommandService';
import Setting from '../models/Setting';
import getActivePluginEditorView from '../services/plugins/utils/getActivePluginEditorView';
import Logger from '@joplin/utils/Logger';
import type { AppState } from '../../../app.reducer';

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

			const shownEditorViewIds = [...(context.state as AppState).shownEditorPluginViewIds];

			if (!editorViewId) {
				const { editorPlugin, editorView } = getActivePluginEditorView(context.state.pluginService.plugins);

				if (!editorPlugin) {
					logger.warn('No editor plugin to toggle to');
					return;
				}

				editorViewId = editorView.id;
			}

			const idx = shownEditorViewIds.indexOf(editorViewId);

			if (show) {
				if (idx >= 0) {
					logger.info(`Editor is already visible: ${editorViewId}`);
					return;
				}

				shownEditorViewIds.push(editorViewId);
			} else {
				if (idx < 0) {
					logger.info(`Editor is already hidden: ${editorViewId}`);
					return;
				}

				shownEditorViewIds.splice(idx, 1);
			}

			logger.info('Shown editor IDs:', shownEditorViewIds);

			Setting.setValue('plugins.shownEditorViewIds', shownEditorViewIds);
			context.dispatch({ type: 'EDITOR_PLUGIN_VIEW_IDS_CHANGED', value: shownEditorViewIds });
		},
	};
};
