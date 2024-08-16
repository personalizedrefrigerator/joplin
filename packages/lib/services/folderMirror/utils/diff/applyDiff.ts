import ItemTree, { ActionListeners } from '../../ItemTree';
import { TreeDiff } from './diffTrees';

const applyDiff = async (diff: TreeDiff, target: ItemTree, actions: ActionListeners) => {
	const conflicts = [];

	for (const [, command] of diff) {
		const dispatchResult = await target.dispatch(command, actions);
		if (dispatchResult.conflicts) {
			conflicts.push(...dispatchResult.conflicts);
		}
	}

	return conflicts;
};

export default applyDiff;
