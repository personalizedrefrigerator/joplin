import ItemTree from '../ItemTree';
import { TreeCommand, TreeCommandType } from './commands';

export default class TreeController {
	public constructor(private tree: ItemTree) {}

	public dispatch(command: TreeCommand) {
		if (command.type === TreeCommandType.Add) {
			this.tree.addItemAt(command.)
		}
	}
}