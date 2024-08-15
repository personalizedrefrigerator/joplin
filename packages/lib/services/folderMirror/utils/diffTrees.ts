import { itemDiffFields } from '../constants';
import keysMatch from './keysMatch';
import ItemTree from '../ItemTree';
import { AddItemCommand, TreeCommand, TreeCommandType } from '../model/commands';

// Returns operations that can be applied to `originalTree` to get `updatedTree`.
const diffTrees = (originalTree: ItemTree, updatedTree: ItemTree) => {
	// Maps from id -> command
	const additions: Map<string, AddItemCommand> = new Map();

	const updates: TreeCommand[] = [];
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
			if (!keysMatch(originalItem, item, itemDiffFields)) {
				updates.push({
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

	const output: TreeCommand[] = [];

	// Check for deletions
	for (const [path, remoteItem] of originalTree.items()) {
		if (handledPaths.has(path)) continue;

		// Item with the removed item's ID created? Move/rename.
		if (additions.has(remoteItem.id)) {
			const addCommand = additions.get(remoteItem.id);
			additions.delete(remoteItem.id);

			output.push({
				type: TreeCommandType.Move,
				originalPath: path,
				newPath: addCommand.path,
				itemType: addCommand.item.type_,
			});
		} else {
			output.push({
				type: TreeCommandType.Remove,
				path,
				itemType: remoteItem.type_,
			});
		}
	}

	for (const command of additions.values()) {
		output.push(command);
	}
	return output.concat(updates);
};

export default diffTrees;
