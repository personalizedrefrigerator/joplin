import { ImportExportResult } from './types';

import InteropService_Importer_Base from './InteropService_Importer_Base';
import InteropService_Importer_Raw from './InteropService_Importer_Raw';
const { filename } = require('../../path-utils');
import shim from '../../shim';
import { extname } from 'path';

export default class InteropService_Importer_Jex extends InteropService_Importer_Base {
	public async exec(result: ImportExportResult) {
		const tempDir = await this.temporaryDirectory_(true);

		if (extname(this.sourcePath_).toLowerCase() === '.jexz') {
			try {
				await shim.fsDriver().zipExtract({
					source: this.sourcePath_,
					extractTo: tempDir,
					onRequestPassword: this.options_.onRequestPassword,
				});
			} catch (error) {
				error.message = `Could not decompress "${this.sourcePath_}". The file may be corrupted. Error was: ${error.message}`;
				throw error;
			}
		} else {
			try {
				await shim.fsDriver().tarExtract({
					strict: true,
					portable: true,
					file: this.sourcePath_,
					cwd: tempDir,
				});
			} catch (error) {
				error.message = `Could not extract "${this.sourcePath_}". The file may be corrupted. Error was: ${error.message}`;
				throw error;
			}
		}

		if (!('defaultFolderTitle' in this.options_)) this.options_.defaultFolderTitle = filename(this.sourcePath_);

		const importer = new InteropService_Importer_Raw();
		await importer.init(tempDir, this.options_);
		result = await importer.exec(result);

		await shim.fsDriver().remove(tempDir);

		return result;
	}
}
