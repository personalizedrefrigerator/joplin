import { MirrorableItemType } from './commands';

export interface FolderItemState {
	itemType: MirrorableItemType;
	id: string|null;
	body: string|null;
	updatedTime: number;
}

export default class FolderItem {
	public constructor() {

	}
}
