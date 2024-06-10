import { Annotation, Transaction } from '@codemirror/state';
import { EditorUpdateReason, UpdateReasonType } from '../../types';

// Annotations provide additional information to editor plugins.
export const switchNotesAnnotation = Annotation.define<{ noteId: string }>();

const updateReasonToAnnotations = (reason: EditorUpdateReason|undefined) => {
	if (!reason) return [];

	const annotations: Annotation<unknown>[] = [];
	if (reason.reason === UpdateReasonType.UserPaste) {
		annotations.push(Transaction.userEvent.of('input.paste'));
	} else if (reason.reason === UpdateReasonType.SwitchNotes) {
		annotations.push(switchNotesAnnotation.of({
			noteId: reason.newNoteId,
		}));
	}

	return annotations;
};

export default updateReasonToAnnotations;
