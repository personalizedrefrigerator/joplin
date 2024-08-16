import itemsMatch from '../itemsMatch';
import keysMatch from '../keysMatch';
import { TreeCommand } from './commands';

const commandsMatch = (commandA: TreeCommand, commandB: TreeCommand) => {
	if (commandA.type !== commandB.type || !keysMatch(commandA, commandB, ['path', 'originalPath', 'newPath', 'newName'])) {
		return false;
	}

	if ('item' in commandA) {
		if (!('item' in commandB)) return false;
		if (!itemsMatch(commandA.item, commandB.item)) return false;
	}

	if ('newItem' in commandA) {
		if (!('newItem' in commandB)) return false;
		if (!itemsMatch(commandA.newItem, commandB.newItem)) return false;
	}

	return true;
};

export default commandsMatch;
