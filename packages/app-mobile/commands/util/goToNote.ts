import Note from '@joplin/lib/models/Note';
import NavService from '@joplin/lib/services/NavService';

const goToNote = async (id: string, hash?: string) => {
	const note = await Note.load(id);
	if (!note) {
		throw new Error(`No note with id ${id}`);
	}

	return NavService.go('Note', {
		noteId: id,
		folderId: note.parent_id,
		noteHash: hash,
	});
};

export default goToNote;
