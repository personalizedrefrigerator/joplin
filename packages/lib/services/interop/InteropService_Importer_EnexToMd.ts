import { ImportExportResult, ImportOptions } from './types';
import importEnex from '../../import-enex';
import InteropService_Importer_Base from './InteropService_Importer_Base';
import Folder from '../../models/Folder';
import { FolderEntity } from '../database/types';
import { fileExtension, rtrimSlashes } from '../../path-utils';
import shim from '../../shim';
const { filename } = require('../../path-utils');

const createDestinationFolder = async (importFilepath: string, parentId: string|undefined) => {
	const title = await Folder.findUniqueItemTitle(filename(importFilepath));
	return await Folder.save({ title, parent_id: parentId ?? '' });
};

const doImportEnex = async (destFolder: FolderEntity, sourcePath: string, options: ImportOptions) => {
	if (!destFolder) {
		destFolder = await createDestinationFolder(sourcePath, undefined);
	}

	await importEnex(destFolder.id, sourcePath, options);
};

export const enexImporterExec = async (result: ImportExportResult, destinationFolder: FolderEntity, sourcePath: string, fileExtensions: string[], options: ImportOptions) => {
	sourcePath = rtrimSlashes(sourcePath);

	if (await shim.fsDriver().isDirectory(sourcePath)) {
		const stats = await shim.fsDriver().readDirStats(sourcePath);

		for (const stat of stats) {
			const fullPath = `${sourcePath}/${stat.path}`;
			if (!fileExtensions.includes(fileExtension(fullPath).toLowerCase())) continue;

			// When importing a directory, avoid putting the imported notes directly in the parent
			// folders (each entry in the directory to import should be given its own Joplin folder).
			const destinationSubfolder = destinationFolder ? await createDestinationFolder(fullPath, destinationFolder.id) : null;

			try {
				await doImportEnex(destinationSubfolder, fullPath, options);
			} catch (error) {
				result.warnings.push(`When importing "${fullPath}": ${error.message}`);
			}
		}
	} else {
		await doImportEnex(destinationFolder, sourcePath, options);
	}

	return result;
};

export default class InteropService_Importer_EnexToMd extends InteropService_Importer_Base {
	public async exec(result: ImportExportResult) {
		let destinationFolder = this.options_.destinationFolder;
		if (!destinationFolder && this.options_.destinationFolderId) {
			destinationFolder = await Folder.load(this.options_.destinationFolderId);
		}

		return enexImporterExec(
			result,
			this.options_.destinationFolder,
			this.sourcePath_,
			this.metadata().fileExtensions,
			this.options_,
		);
	}

}
