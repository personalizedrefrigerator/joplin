import { CommandRuntime, CommandDeclaration, CommandContext } from '@joplin/lib/services/CommandService';
import { _ } from '@joplin/lib/locale';
import NavService from '@joplin/lib/services/NavService';

export const declaration: CommandDeclaration = {
	name: 'showToolbarSettings',
	label: () => _('Toolbar settings'),
	iconName: 'material cogs',
};

export const runtime = (): CommandRuntime => {
	return {
		execute: async (_context: CommandContext) => {
			void NavService.go('ToolbarEditor');
		},

		enabledCondition: '!noteIsReadOnly',
	};
};
