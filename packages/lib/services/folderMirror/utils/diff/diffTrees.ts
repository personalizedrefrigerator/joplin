import ItemTree from '../../ItemTree';
import { AddItemCommand, TreeCommand, TreeCommandType } from './commands';
import itemsMatch from '../itemsMatch';

type PathString = string;
export type TreeDiff = Map<PathString, TreeCommand>;
type IdString = string;

// Returns operations that can be applied to `originalTree` to get `updatedTree`.
const diffTrees = (originalTree: ItemTree, updatedTree: ItemTree): TreeDiff => {
	// Maps from id -> command
	const additions: Map<IdString, AddItemCommand> = new Map();
	const output: TreeDiff = new Map();

	const handledPaths = new Set<string>();

	for (const [itemPath, item] of updatedTree.items()) {
		if (handledPaths.has(itemPath)) continue;

		// Focus on diffing with paths, rather than IDs. The ID property can be unreliable when,
		// for example, a file is duplicated in the remote tree.
		if (!originalTree.hasPath(itemPath)) {
			additions.set(item.id, {
				type: TreeCommandType.Add,
				path: itemPath,
				item,
				itemType: item.type_,
			});
		} else {
			const originalItem = originalTree.getAtPath(itemPath);
			if (!itemsMatch(originalItem, item)) {
				output.set(itemPath, {
					type: TreeCommandType.Update,
					path: itemPath,
					// TODO: Handle the case where the ID changes?
					newItem: item,
					itemType: item.type_,
				});
			}
		}
		handledPaths.add(itemPath);
	}

	// Check for deletions
	for (const [path, remoteItem] of originalTree.items()) {
		if (handledPaths.has(path)) continue;

		// Item with the removed item's ID created? Move/rename.
		if (remoteItem.id && additions.has(remoteItem.id)) {
			const addCommand = additions.get(remoteItem.id);
			additions.delete(remoteItem.id);

			output.set(path, {
				type: TreeCommandType.Move,
				originalPath: path,
				newPath: addCommand.path,
				itemType: addCommand.item.type_,
			});
		} else {
			output.set(path, {
				type: TreeCommandType.Remove,
				path,
				itemType: remoteItem.type_,
			});
		}
	}

	for (const command of additions.values()) {
		output.set(command.path, command);
	}
	return output;
};

export default diffTrees;
