import { MarkupLanguage } from '@joplin/renderer';
import { _ } from '../../../../locale';
import Setting from '../../../../models/Setting';
import CommandService from '../../../../services/CommandService';
import shim from '../../../../shim';

type NoteSlice = {
	id: string;
	markup_language: MarkupLanguage;
};

interface Props {
	note: NoteSlice;
	readOnly: boolean;
	dismissed: boolean;
}

const useConvertToMarkdownBanner = ({ note, readOnly, dismissed }: Props) => {
	const React = shim.react();
	const noteId = note.id;
	const enabled = !readOnly && !dismissed && note?.markup_language === MarkupLanguage.Html;

	return React.useMemo(() => {
		return {
			enabled,
			label: _('This note is in HTML format. Convert it to Markdown to edit it more easily.'),
			dismiss: {
				label: _('Don\'t show this message again'),
				onPress: () => {
					Setting.setValue('editor.enableHtmlToMarkdownBanner', false);
				},
			},
			convert: {
				label: _('Convert it'),
				onPress: async () => {
					if (!noteId) return;
					await CommandService.instance().execute('convertNoteToMarkdown', noteId);
				},
			},
		};
	}, [noteId, enabled]);
};

export default useConvertToMarkdownBanner;
