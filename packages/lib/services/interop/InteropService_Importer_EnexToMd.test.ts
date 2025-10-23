import { join } from 'path';
import Folder from '../../models/Folder';
import { setupDatabase, supportDir, switchClient } from '../../testing/test-utils';
import { ImportModuleOutputFormat, ImportOptions } from './types';
import InteropService from './InteropService';
import Note from '../../models/Note';
import { NoteEntity } from '../database/types';

describe('InteropService_Importer_EnexToMd', () => {
	beforeEach(async () => {
		await setupDatabase(1);
		await switchClient(1);
	});

	it('should support importing to the provided destinationFolderId for directory imports', async () => {
		const folder = await Folder.save({ title: 'base' });
		const importOptions: ImportOptions = {
			path: join(supportDir, 'enex_full', 'root'),
			format: 'enex',
			destinationFolderId: folder.id,
			outputFormat: ImportModuleOutputFormat.Markdown,
		};

		const result = await InteropService.instance().import(importOptions);
		expect(result.warnings).toHaveLength(0);

		const allFolders = await Folder.allAsTree();
		expect(allFolders).toMatchObject([{
			title: 'base',
			children: [{ title: 'item1' }, { title: 'item2' }],
		}]);

		const checkFolderContent = async (folderTitle: string, expected: Partial<NoteEntity>[]) => {
			const folder = await Folder.loadByTitle(folderTitle);
			expect(await Note.previews(folder.id)).toMatchObject(expected);
		};

		await checkFolderContent('item1', [
			{ title: 'Test 1' },
		]);
		await checkFolderContent('item2', [
			{ title: 'Note 2' },
		]);
	});
});
