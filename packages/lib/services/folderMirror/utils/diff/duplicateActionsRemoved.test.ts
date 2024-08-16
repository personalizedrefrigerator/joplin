import { ModelType } from '../../../../BaseModel';
import { baseItem } from '../../constants';
import ItemTree, { noOpActionListeners } from '../../ItemTree';
import diffTrees from './diffTrees';
import duplicateActionsRemoved from './duplicateActionsRemoved';

describe('folderMirror/duplicateActionsRemoved', () => {
	test('should remove identical actions (identical diffs against the same tree)', async () => {
		const empty = new ItemTree(baseItem);
		const nonempty = new ItemTree(baseItem);
		await nonempty.addItemTo(
			'',
			{ title: 'Test', id: '12345678901237567890123456789012', type_: ModelType.Note },
			noOpActionListeners,
		);

		const diff1 = diffTrees(empty, nonempty);
		expect(diff1.size).toBe(1);
		expect(duplicateActionsRemoved(diff1, diff1)).toMatchObject([new Map(), new Map()]);

		await nonempty.addItemTo(
			'',
			{ title: 'Test', id: '13345678901237567890123456789012', type_: ModelType.Note },
			noOpActionListeners,
		);
		const diff2 = diffTrees(empty, nonempty);
		expect(diff2.size).toBe(2);
		// Should remove one item from each (the command common to both).
		expect(duplicateActionsRemoved(diff1, diff2)[0].size).toBe(0);
		expect(duplicateActionsRemoved(diff1, diff2)[1].size).toBe(1);
	});
});
