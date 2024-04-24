import { _ } from '@joplin/lib/locale';
import Setting from '@joplin/lib/models/Setting';
import bridge from '../../../services/bridge';
const { ALL_NOTES_FILTER_ID } = require('@joplin/lib/reserved-ids');

interface Props {
	notesParentType: string;
	selectedSmartFilterId: string;
	noteSortOrder: string;
	selectedFolderInTrash: boolean;
	allowPromptToSwitch: boolean;
}

const canManuallySortNotes = ({ notesParentType, selectedSmartFilterId, noteSortOrder, selectedFolderInTrash, allowPromptToSwitch }: Props) => {
	const allNotesSelected = notesParentType === 'SmartFilter' && selectedSmartFilterId === ALL_NOTES_FILTER_ID;
	if (notesParentType !== 'Folder' && !allNotesSelected) return false;
	if (selectedFolderInTrash) return false;

	if (noteSortOrder !== 'order') {
		if (allowPromptToSwitch) {
			const doIt = bridge().showConfirmMessageBox(_('To manually sort the notes, the sort order must be changed to "%s" in the menu "%s" > "%s"', _('Custom order'), _('View'), _('Sort notes by')), {
				buttons: [_('Do it now'), _('Cancel')],
			});
			if (!doIt) return false;

			Setting.setValue('notes.sortOrder.field', 'order');
		}
		return false;
	}
	return true;
};

export default canManuallySortNotes;
