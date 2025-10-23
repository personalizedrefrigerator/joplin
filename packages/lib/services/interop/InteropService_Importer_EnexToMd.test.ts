import { join } from 'path';
import Folder from '../../models/Folder';
import { setupDatabase, supportDir, switchClient } from '../../testing/test-utils';
import { ImportModuleOutputFormat, ImportOptions } from './types';
import InteropService from './InteropService';
import Note from '../../models/Note';

describe('InteropService_Importer_EnexToMd', () => {
	beforeEach(async () => {
		await setupDatabase(1);
		await switchClient(1);
	});

	it('should create Joplin folders based on the input folder hierarchy', async () => {
		const folder = await Folder.save({ title: 'base' });
		const importOptions: ImportOptions = {
			path: join(supportDir, 'enex_nested_folders'),
			format: 'enex',
			destinationFolderId: folder.id,
			outputFormat: ImportModuleOutputFormat.Markdown,
		};

		const result = await InteropService.instance().import(importOptions);
		expect(result.warnings).toHaveLength(0);

		const allFolders = await Folder.allAsTree();
		expect(allFolders).toMatchObject([{
			title: 'base',
			children: [{
				title: 'root',
				children: [
					{ title: 'Folder A' },
					{ title: 'Folder B' },
				],
			}],
		}]);

		const folderA = await Folder.loadByTitle('Folder A');
		const folderB = await Folder.loadByTitle('Folder B');

		expect(await Note.previews(folderA.id)).toMatchObject([
			{ title: 'Test 1' },
		]);
		expect(await Note.previews(folderB.id)).toMatchObject([
			{ title: 'Note 2' },
		]);
	});
});
