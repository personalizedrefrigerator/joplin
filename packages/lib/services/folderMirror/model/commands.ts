import { ModelType } from "../../../BaseModel"

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
	itemType: MirrorableItemType,
}

interface AddItemCommand {
	type: TreeCommandType.Add,

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

export type TreeCommand = (AddItemCommand | MoveItemCommand | RenameItemCommand) & BaseCommand;

