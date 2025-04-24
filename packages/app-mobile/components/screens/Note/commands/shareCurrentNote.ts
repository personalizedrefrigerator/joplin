import { CommandRuntime, CommandDeclaration, CommandContext } from '@joplin/lib/services/CommandService';
import { _ } from '@joplin/lib/locale';
import { CommandRuntimeProps } from '../types';
import { Platform, Share } from 'react-native';
import showFile from '../../../../utils/showFile';
import shim from '@joplin/lib/shim';
import Setting from '@joplin/lib/models/Setting';
import uuid from '@joplin/lib/uuid';
import Note from '@joplin/lib/models/Note';
import { NoteEntity } from '@joplin/lib/services/database/types';
import InteropService from '@joplin/lib/services/interop/InteropService';
import { ExportModuleOutputFormat, FileSystemItem } from '@joplin/lib/services/interop/types';

export const declaration: CommandDeclaration = {
	name: 'shareCurrentNote',
	label: () => _('Share current note'),
};

export const runtime = (props: CommandRuntimeProps): CommandRuntime => {
	const shareText = async (title: string, content: string) => {
		const message = `${title}\n\n${content}`;
		const shareSupported = Platform.OS !== 'web' || !!navigator.share;
		if (shareSupported) {
			await Share.share({
				message: `${title}\n\n${content}`,
				title: title,
			});
		} else {
			const tempFilePath = `${Setting.value('tempDir')}/${uuid.create()}.md`;
			await shim.fsDriver().writeFile(tempFilePath, message, 'utf8');
			await showFile(tempFilePath);
			await shim.fsDriver().remove(tempFilePath);
		}
	};

	const showShareMenu = async (note: NoteEntity) => {
		const htmlId = 'html';
		const textId = 'text';
		const answer = await props.dialogs.showMenu(
			_('Share as...'), [
				{ text: _('Rich Text (HTML)'), id: htmlId },
				{ text: _('Text only'), id: textId },
			],
		);

		if (answer === htmlId) {
			const exportDirectory = `${Setting.value('tempDir')}/export-note-${uuid.create()}`;
			await shim.fsDriver().mkdir(exportDirectory);
			const exportPath = `${exportDirectory}/index.html`;


			await InteropService.instance().export({
				path: exportPath,
				format: ExportModuleOutputFormat.Html,
				packIntoSingleFile: true,
				target: FileSystemItem.File,
			});

			await showFile(exportPath);

			await shim.fsDriver().remove(exportDirectory, { recursive: true });
		} else if (answer === textId) {
			await shareText(note.title, note.body);
		}
	};

	return {
		execute: async (context: CommandContext) => {
			const noteId = context.state.selectedNoteIds[0];
			if (!noteId) {
				throw new Error('No note ID selected');
			}

			const note = await Note.load(noteId);
			await showShareMenu(note);
		},

		enabledCondition: '',
	};
};
