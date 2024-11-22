import { CommandContext, CommandDeclaration, CommandRuntime } from '@joplin/lib/services/CommandService';
import { _ } from '@joplin/lib/locale';
import Setting from '@joplin/lib/models/Setting';
import getActivePluginEditorView from '@joplin/lib/services/plugins/utils/getActivePluginEditorView';
import Logger from '@joplin/utils/Logger';

const logger = Logger.create('toggleEditorPlugin');

export const declaration: CommandDeclaration = {
	name: 'toggleEditorPlugin',
	label: () => _('Toggle editor plugin'),
	iconName: 'fas fa-eye',
};

export const runtime = (): CommandRuntime => {
	return {
		execute: async (context: CommandContext) => {
			const shownEditorViewIds = Setting.value('plugins.shownEditorViewIds');
			const { editorPlugin, editorView } = getActivePluginEditorView(context.state.pluginService.plugins);

			if (!editorPlugin) {
				logger.warn('No editor plugin to toggle to');
				return;
			}

			const idx = shownEditorViewIds.indexOf(editorView.id);

			if (idx < 0) {
				shownEditorViewIds.push(editorView.id);
			} else {
				shownEditorViewIds.splice(idx, 1);
			}

			Setting.setValue('plugins.shownEditorViewIds', shownEditorViewIds);
		},
	};
};
