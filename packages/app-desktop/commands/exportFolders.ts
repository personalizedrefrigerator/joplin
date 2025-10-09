import { CommandRuntime, CommandDeclaration, CommandContext } from '@joplin/lib/services/CommandService';
import InteropService from '@joplin/lib/services/interop/InteropService';
import { ExportModuleOutputFormat, ExportOptions, FileSystemItem } from '@joplin/lib/services/interop/types';
import shim from '@joplin/lib/shim';

export const declaration: CommandDeclaration = {
	name: 'exportFolders',
};

interface Options {
	password?: string;
}

export const runtime = (): CommandRuntime => {
	return {
		// "targetPath" should be a file for JEX export (because the format can
		// contain multiple folders) or a directory otherwise.
		execute: async (
			_context: CommandContext, folderIds: string[], format: ExportModuleOutputFormat, targetPath: string, { password }: Options = {},
		) => {
			const exportOptions: ExportOptions = {
				sourceFolderIds: folderIds,
				path: targetPath,
				format: format,
				target: FileSystemItem.Directory,
				password,
			};

			const targetMustBeFile = format === ExportModuleOutputFormat.Jex || format === ExportModuleOutputFormat.JexCompressed;
			const targetIsDir = await shim.fsDriver().isDirectory(targetPath);

			if (targetMustBeFile && targetIsDir) {
				throw new Error(`Format "${format}" can only be exported to a file`);
			}

			if (targetMustBeFile || !targetIsDir) {
				exportOptions.target = FileSystemItem.File;
			}

			return InteropService.instance().export(exportOptions);
		},
	};
};
