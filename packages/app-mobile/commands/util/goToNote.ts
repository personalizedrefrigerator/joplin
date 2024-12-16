import Note from '@joplin/lib/models/Note';
import NavService from '@joplin/lib/services/NavService';
import { AttachFileAction } from '../../components/screens/Note/commands/attachFile';

export interface GotoNoteOptions {
	attachFileAction?: AttachFileAction | null;
}

const goToNote = async (id: string, hash?: string, options: GotoNoteOptions = null) => {
	options = {
		attachFileAction: null,
		...options,
	};

	const note = await Note.load(id);
	if (!note) {
		throw new Error(`No note with id ${id}`);
	}

	return NavService.go('Note', {
		noteId: id,
		// Always provide a folderId -- omitting this can lead to invalid state
		folderId: note.parent_id,
		noteHash: hash,
		newNoteAttachFileAction: options.attachFileAction,
	});
};

export default goToNote;
