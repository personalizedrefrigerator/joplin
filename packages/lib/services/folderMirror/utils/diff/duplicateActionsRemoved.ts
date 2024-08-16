import commandsMatch from './commandsMatch';
import { TreeDiff } from './diffTrees';

const duplicateActionsRemovedSingle = (diff: Readonly<TreeDiff>, otherDiff: Readonly<TreeDiff>) => {
	const newDiff: TreeDiff = new Map();

	for (const [path, command] of diff) {
		if (!otherDiff.has(path) || !commandsMatch(command, otherDiff.get(path))) {
			newDiff.set(path, command);
		}
	}

	return newDiff;
};

const duplicateActionsRemoved = (diffA: Readonly<TreeDiff>, diffB: Readonly<TreeDiff>) => {
	return [
		duplicateActionsRemovedSingle(diffA, diffB),
		duplicateActionsRemovedSingle(diffB, diffA),
	];
};

export default duplicateActionsRemoved;
