import { dirname, join } from 'path';
import ItemTree, { ActionListeners } from '../ItemTree';
import { TreeCommand, TreeCommandType } from './commands';

export default class TreeController {
	public constructor(private tree: ItemTree, private actionListeners: ActionListeners) {}

	public dispatch(command: TreeCommand) {
		if (command.type === TreeCommandType.Add) {
			return this.tree.addItemTo(command.parentPath, command.item, this.actionListeners);
		} else if (command.type === TreeCommandType.Move) {
			return this.tree.move(command.originalPath, command.newPath, this.actionListeners);
		} else if (command.type === TreeCommandType.Remove) {
			return this.tree.deleteAtPath(command.path, this.actionListeners);
		} else if (command.type === TreeCommandType.Rename) {
			const toPath = join(dirname(command.originalPath), command.newName);
			return this.tree.move(command.originalPath, toPath, this.actionListeners);
		}
		const exhaustivenessCheck: never = command;
		return exhaustivenessCheck;
	}
}
