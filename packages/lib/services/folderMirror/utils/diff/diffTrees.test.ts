import { ModelType } from '../../../../BaseModel';
import { baseItem } from '../../constants';
import ItemTree, { noOpActionListeners } from '../../ItemTree';
import diffTrees from './diffTrees';

describe('folderMirror/diffTrees', () => {
	test('should diff with the empty tree', async () => {
		const emptyTree = new ItemTree(baseItem);
		const updatedTree = new ItemTree(baseItem);
		await updatedTree.addItemTo('', { title: 'Test', id: '12345678901234567890123456789012', type_: ModelType.Note }, noOpActionListeners);

		expect(diffTrees(emptyTree, updatedTree)).toMatchSnapshot('diff: empty vs single note');

		await updatedTree.addItemTo('', { title: 'Note 2', id: '22345678901234567890123456789012', type_: ModelType.Note }, noOpActionListeners);
		await updatedTree.addItemTo('', { title: 'Folder 1', id: '32345678901234567890123456789012', type_: ModelType.Folder }, noOpActionListeners);
		await updatedTree.addItemTo('Folder 1', { title: 'Test', id: '22345678901234567890123456789013', type_: ModelType.Note }, noOpActionListeners);

		expect(diffTrees(emptyTree, updatedTree)).toMatchSnapshot('diff: empty vs folder and notes');
	});

	test('diffs should include updates to items', async () => {
		const baseTree = new ItemTree(baseItem);
		const updatedTree = new ItemTree(baseItem);
		const testNote = { title: 'Test', id: '12345678901234567890123456789012', body: '', type_: ModelType.Note };
		await baseTree.addItemTo('', testNote, noOpActionListeners);
		await updatedTree.addItemTo('', { ...testNote, body: 'updated!' }, noOpActionListeners);

		expect(diffTrees(baseTree, updatedTree)).toMatchSnapshot();
	});

	test('diffs should include deletions', async () => {
		const baseTree = new ItemTree(baseItem);
		const updatedTree = new ItemTree(baseItem);
		const testNote = { title: 'Test', id: '12345678901234567890123456789012', body: '', type_: ModelType.Note };
		await baseTree.addItemTo('', testNote, noOpActionListeners);

		expect(diffTrees(baseTree, updatedTree)).toMatchSnapshot();
	});
});
