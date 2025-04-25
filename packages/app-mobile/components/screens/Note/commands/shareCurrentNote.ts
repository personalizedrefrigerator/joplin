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
import type FsDriverWeb from '../../../../utils/fs-driver/fs-driver-rn.web';
import { filename } from '@joplin/utils/path';

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
		} else if (Platform.OS === 'web') {
			const tempFilePath = `${Setting.value('tempDir')}/${uuid.create()}.md`;

			// The file doesn't need to be persistent to be shared -- write to a virtual file
			const tempFileContent = new File([message], filename(tempFilePath));
			await (shim.fsDriver() as FsDriverWeb).createReadOnlyVirtualFile(tempFilePath, tempFileContent);

			// ...then share the virtual file.
			await showFile(tempFilePath);
		} else {
			throw new Error('Share unsupported');
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
			// Use the same exported-note.html file for all single-note exports -- removing the file immediately
			// after sharing breaks the file viewer on Android.
			const targetFile = `${Setting.value('tempDir')}/exported-note.html`;
			await shim.fsDriver().mkdir(exportDirectory);
			try {
				const exportPath = `${exportDirectory}/index.html`;

				await InteropService.instance().export({
					path: exportPath,
					format: ExportModuleOutputFormat.Html,
					packIntoSingleFile: true,
					target: FileSystemItem.File,
				});

				await shim.fsDriver().copy(exportPath, targetFile);
			} finally {
				await shim.fsDriver().remove(exportDirectory, { recursive: true });
			}

			await showFile(targetFile);
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
