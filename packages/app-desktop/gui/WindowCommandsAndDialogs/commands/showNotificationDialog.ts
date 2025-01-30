import { CommandRuntime, CommandDeclaration } from '@joplin/lib/services/CommandService';
import { _ } from '@joplin/lib/locale';
import { WindowControl } from '../utils/useWindowControl';

export const declaration: CommandDeclaration = {
	name: 'showNotificationDialog',
	label: () => _('Recent notifications'),
};

export const runtime = (comp: WindowControl): CommandRuntime => {
	return {
		execute: async () => {
			comp.setState({
				notificationDialogOptions: {
					visible: true,
				},
			});
		},
	};
};
