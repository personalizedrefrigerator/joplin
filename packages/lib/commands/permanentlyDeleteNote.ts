import { CommandRuntime, CommandDeclaration, CommandContext } from '../services/CommandService';
import { _ } from '../locale';
import Note from '../models/Note';
import shim, { MessageBoxType } from '../shim';

export const declaration: CommandDeclaration = {
	name: 'permanentlyDeleteNote',
	label: () => _('Permanently delete note'),
	iconName: 'fa-times',
};

export const runtime = (): CommandRuntime => {
	return {
		execute: async (context: CommandContext, noteIds: string[] = null) => {
			if (noteIds === null) noteIds = context.state.selectedNoteIds;
			if (!noteIds.length) return;
			const msg = await Note.permanentlyDeleteMessage(noteIds);

			const deleteLabel = _('Delete');
			const cancelLabel = _('Cancel');
			let buttons;
			let deleteIndex;
			let cancelIndex;

			// On desktop, 'Cancel' is usually shown on the right:
			if (shim.isElectron()) {
				buttons = [deleteLabel, cancelLabel];
				deleteIndex = 0;
				cancelIndex = 1;
			} else {
				buttons = [cancelLabel, deleteLabel];
				deleteIndex = 1;
				cancelIndex = 0;
			}

			const result = await shim.showMessageBox(msg, {
				buttons,
				defaultId: 1,
				cancelId: cancelIndex,
				type: MessageBoxType.Confirm,
			});

			if (result === deleteIndex) {
				await Note.batchDelete(noteIds, { toTrash: false, sourceDescription: 'permanentlyDeleteNote command' });
			}
		},
		enabledCondition: '(!noteIsReadOnly || inTrash) && someNotesSelected',
	};
};
