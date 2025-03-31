import CommandService, { CommandContext, CommandDeclaration, CommandRuntime } from '../services/CommandService';
import { _ } from '../locale';
import Logger from '@joplin/utils/Logger';
import getActivePluginEditorViews from '../services/plugins/utils/getActivePluginEditorViews';

const logger = Logger.create('toggleEditorPlugin');

export const declaration: CommandDeclaration = {
	name: 'toggleEditorPlugin',
	label: () => _('Toggle editor plugin'),
	iconName: 'fas fa-eye',
};

export const runtime = (): CommandRuntime => {
	return {
		execute: async (context: CommandContext) => {
			const activeWindowId = context.state.windowId;
			const activePluginStates = getActivePluginEditorViews(context.state.pluginService.plugins, activeWindowId);

			if (activePluginStates.length === 0) {
				logger.warn('No editor plugin to toggle to');
				return;
			}

			let hasBeenHidden = false;
			for (const { editorView } of activePluginStates) {
				if (editorView.opened) {
					await CommandService.instance().execute('showEditorPlugin', editorView.id, false);
					hasBeenHidden = true;
					break;
				}
			}

			if (!hasBeenHidden) {
				const firstActiveEditorView = activePluginStates[0].editorView;
				await CommandService.instance().execute('showEditorPlugin', firstActiveEditorView.id);
			}

			// TODO:
			// Setting.setValue('plugins.shownEditorViewIds', shownEditorViewIds);

			if (hasBeenHidden) {
				// When the plugin editor goes from visible to hidden, we need to reload the note
				// because it may have been changed via the data API.
				context.dispatch({
					type: 'EDITOR_NOTE_NEEDS_RELOAD',
				});
			}
		},

		enabledCondition: 'hasActivePluginEditor',
	};
};
