import { ModelType } from '../../../BaseModel';
import { FolderItem } from '../types';

export enum TreeCommandType {
	Rename,
	Move,
	Add,
	Remove,
}

export enum MirrorableItemType {
	Folder = ModelType.Folder,
	Note = ModelType.Note,
	Resource = ModelType.Resource,
}

interface BaseCommand {
	itemType: MirrorableItemType;
}

interface AddItemCommand {
	type: TreeCommandType.Add;
	parentPath: string;
	item: FolderItem;
}

interface MoveItemCommand {
	type: TreeCommandType.Move;
	originalPath: string;
	newPath: string;
}

interface RenameItemCommand {
	type: TreeCommandType.Rename;
	originalPath: string;
	newName: string;
}

interface RemoveItemCommand {
	type: TreeCommandType.Remove;
	path: string;
}

export type TreeCommand = (AddItemCommand | MoveItemCommand | RemoveItemCommand | RenameItemCommand) & BaseCommand;

