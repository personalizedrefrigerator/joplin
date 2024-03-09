import Folder from "../../models/Folder";
import { ModelType } from "../../types";

type ItemSlice = { id?: string };
const isTrashableItem = (itemType: ModelType, item: ItemSlice) => {
	if (itemType !== ModelType.Folder && itemType !== ModelType.Note) {
		return false;
	}

	// The conflict folder can't be trashed.
	return item.id !== Folder.conflictFolderId();
};

export default isTrashableItem;