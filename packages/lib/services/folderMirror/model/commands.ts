import { ModelType } from '../../../BaseModel';
import { FolderItem } from '../types';

export enum TreeCommandType {
	Add = 'add',
	Update = 'update',
	Rename = 'rename',
	Move = 'move',
	Remove = 'remove',
}

export enum MirrorableItemType {
	Folder = ModelType.Folder,
	Note = ModelType.Note,
	Resource = ModelType.Resource,
}

interface BaseCommand {
	itemType: MirrorableItemType;
}

export interface AddItemCommand extends BaseCommand {
	type: TreeCommandType.Add;
	path: string;
	item: FolderItem;
}

interface UpdateItemCommand extends BaseCommand {
	type: TreeCommandType.Update;
	path: string;
	newItem: FolderItem;
}

interface MoveItemCommand extends BaseCommand {
	type: TreeCommandType.Move;
	originalPath: string;
	newPath: string;
}

interface RenameItemCommand extends BaseCommand {
	type: TreeCommandType.Rename;
	originalPath: string;
	newName: string;
}

interface RemoveItemCommand extends BaseCommand {
	type: TreeCommandType.Remove;
	path: string;
}

export type TreeCommand = AddItemCommand | UpdateItemCommand | MoveItemCommand | RemoveItemCommand | RenameItemCommand;

