import { ImportExportResult, ImportOptions } from './types';
import importEnex from '../../import-enex';
import InteropService_Importer_Base from './InteropService_Importer_Base';
import Folder from '../../models/Folder';
import { FolderEntity } from '../database/types';
import { fileExtension, rtrimSlashes } from '../../path-utils';
import shim from '../../shim';
import { basename } from 'path';
import { Stat } from '../../fs-driver-base';
const { filename } = require('../../path-utils');

const doImportEnex = async (destFolder: FolderEntity, sourcePath: string, options: ImportOptions) => {
	if (!destFolder) {
		const folderTitle = await Folder.findUniqueItemTitle(filename(sourcePath));
		destFolder = await Folder.save({ title: folderTitle });
	}

	await importEnex(destFolder.id, sourcePath, options);
};

const importEnexDirectory = async (result: ImportExportResult, rootDestinationFolder: FolderEntity|null, sourcePath: string, fileExtensions: string[], options: ImportOptions) => {
	const stats = await shim.fsDriver().readDirStats(sourcePath);

	const destinationFolderFromStat = (stat: Stat) => {
		if (stat.isDirectory()) {
			return Folder.save({
				title: basename(stat.path),
				parent_id: rootDestinationFolder?.id ?? '',
			});
		} else {
			return rootDestinationFolder;
		}
	};

	for (const stat of stats) {
		const fullPath = `${sourcePath}/${stat.path}`;
		const newDestinationFolder = await destinationFolderFromStat(stat);

		if (stat.isDirectory()) {
			await importEnexDirectory(result, newDestinationFolder, fullPath, fileExtensions, options);
		} else if (fileExtensions.includes(fileExtension(fullPath).toLowerCase())) {
			try {
				await doImportEnex(newDestinationFolder, fullPath, options);
			} catch (error) {
				result.warnings.push(`When importing "${fullPath}": ${error.message}`);
			}
		}
	}
};

export const enexImporterExec = async (result: ImportExportResult, destinationFolder: FolderEntity|null, sourcePath: string, fileExtensions: string[], options: ImportOptions) => {
	sourcePath = rtrimSlashes(sourcePath);

	if (await shim.fsDriver().isDirectory(sourcePath)) {
		await importEnexDirectory(result, destinationFolder, sourcePath, fileExtensions, options);
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
