import ItemTree, { ActionListeners } from '../../ItemTree';
import diffTrees from './diffTrees';
import applyDiff from './applyDiff';
import duplicateActionsRemoved from './duplicateActionsRemoved';

interface Options {
	journalTree: ItemTree;
	localTree: ItemTree;
	remoteTree: ItemTree;
	modifyLocal: ActionListeners;
	modifyRemote: ActionListeners;
}

const mergeTrees = async (
	{ journalTree, localTree, remoteTree, modifyLocal, modifyRemote }: Options,
) => {
	// 1. Diff -- collect differences between the local and remote trees.
	let localDiff = diffTrees(journalTree, localTree);
	let remoteDiff = diffTrees(journalTree, remoteTree);

	// 2. Make it possible to cleanly apply each diff to the other tree.
	//    This allows more modifications on [rename]d and [move]d items
	//    to be merged without conflicts.
	[localDiff, remoteDiff] = duplicateActionsRemoved(localDiff, remoteDiff);

	// 3. Use the diffs to merge the trees. Currently,
	//  - localDiff contains the steps to go from journalTree to localTree
	//  - remoteDiff contains the steps to go from journalTree to remoteTree
	// Our goal is to use these two diffs to create a single tree.
	const remoteConflicts = await applyDiff(localDiff, remoteTree, modifyRemote);
	const localConflicts = await applyDiff(remoteDiff, localTree, modifyLocal);

	// 4. Save conflicted items separately.
	if (remoteConflicts.length || localConflicts.length) {
		const conflictMessage = (conflicts: typeof remoteConflicts) => {
			return conflicts.map(c => c.message).join('\n').replace(/\n|^/g, '\n    ');
		};
		throw new Error(
			`Conflict handling is not implemented! Conflicts: ${conflictMessage(remoteConflicts)}\n\n${conflictMessage(localConflicts)}`,
		);
	}
};

export default mergeTrees;
