import { FolderEntity, TagEntity, TagsWithNoteCountEntity } from '../../services/database/types';
import { getDisplayParentId } from '../../services/trash';
import { getCollator } from '../../models/utils/getCollator';
import Folder from '../../models/Folder';

export type RenderFolderItem<T> = (folder: FolderEntity, hasChildren: boolean, depth: number)=> T;
export type RenderTagItem<T> = (tag: TagsWithNoteCountEntity)=> T;

interface FolderSelectedContext {
	selectedFolderId: string;
	notesParentType: string;
}
export const isFolderSelected = (folder: FolderEntity, context: FolderSelectedContext) => {
	return context.selectedFolderId === folder.id && context.notesParentType === 'Folder';
};


type ItemsWithOrder<ItemType> = {
	items: ItemType[];
	order: string[];
};

interface FolderTree {
	folders: FolderEntity[];
	parentIdToChildren: Map<string, FolderEntity[]>;
	misplacedItems: FolderEntity[]; // Folders with missing parents
	idToItem: Map<string, FolderEntity>;
}

interface RenderFoldersProps {
	folderTree: FolderTree;
	collapsedFolderIds: string[];
}

export const renderFolders = <T> (props: RenderFoldersProps, renderItem: RenderFolderItem<T>): ItemsWithOrder<T> => {
	const renderedIds = new Set<string>();
	const items: T[] = [];
	const order: string[] = [];
	const parentIdToChildren = props.folderTree.parentIdToChildren;
	const collapsedFolderIds = props.collapsedFolderIds ?? [];

	const renderFolder_ = (folder: FolderEntity, depth: number) => {
		// Handle invalid state: Cyclic parent_ids.
		if (renderedIds.has(folder.id)) return;

		const hasChildren = parentIdToChildren.has(folder.id);
		order.push(folder.id);
		renderedIds.add(folder.id);
		items.push(renderItem(folder, hasChildren, depth));
		if (hasChildren && !collapsedFolderIds.includes(folder.id)) {
			renderFoldersRecursive_(folder.id, depth + 1);
		}
	};

	const renderFoldersRecursive_ = (parentId: string, depth: number) => {
		const folders = props.folderTree.parentIdToChildren.get(parentId ?? '') ?? [];
		for (const folder of folders) {
			renderFolder_(folder, depth);
		}
	};
	renderFoldersRecursive_('', 0);

	const renderMisplacedFolders = () => {
		if (props.folderTree.misplacedItems.length === 0) return;

		const misplacedItem = Folder.misplacedFolder();
		items.push(renderItem(misplacedItem, true, 0));
		order.push(misplacedItem.id);

		if (!collapsedFolderIds.includes(misplacedItem.id)) {
			for (const folder of props.folderTree.misplacedItems) {
				renderFolder_(folder, 1);
			}
		}
	};
	renderMisplacedFolders();

	return { items, order };
};

export const buildFolderTree = (folders: FolderEntity[]): FolderTree => {
	const idToItem = new Map<string, FolderEntity>();
	for (const folder of folders) {
		idToItem.set(folder.id, folder);
	}

	const misplacedItems = [];
	const parentIdToChildren = new Map<string, FolderEntity[]>();
	for (const folder of folders) {
		const displayParentId = getDisplayParentId(folder, idToItem.get(folder.parent_id)) ?? '';
		if (!parentIdToChildren.has(displayParentId)) {
			parentIdToChildren.set(displayParentId, []);
		}
		parentIdToChildren.get(displayParentId).push(folder);

		if (folder.parent_id && !idToItem.has(folder.parent_id) && !Folder.isVirtualFolder(folder.parent_id)) {
			misplacedItems.push(folder);
		}
	}

	return { folders, parentIdToChildren, misplacedItems, idToItem };
};

const sortTags = (tags: TagEntity[]) => {
	tags = tags.slice();
	const collator = getCollator();
	tags.sort((a, b) => {
		// It seems title can sometimes be undefined (perhaps when syncing
		// and before tag has been decrypted?). It would be best to find
		// the root cause but for now that will do.
		//
		// Fixes https://github.com/laurent22/joplin/issues/4051
		if (!a || !a.title || !b || !b.title) return 0;

		// Note: while newly created tags are normalized and lowercase
		// imported tags might be any case, so we need to do case-insensitive
		// sort.
		return collator.compare(a.title, b.title);
	});
	return tags;
};

interface TagSelectedContext {
	selectedTagId: string;
	notesParentType: string;
}
export const isTagSelected = (tag: TagEntity, context: TagSelectedContext) => {
	return context.selectedTagId === tag.id && context.notesParentType === 'Tag';
};

export const renderTags = <T> (unsortedTags: TagsWithNoteCountEntity[], renderItem: RenderTagItem<T>): ItemsWithOrder<T> => {
	const tags = sortTags(unsortedTags);
	const tagItems = [];
	const order: string[] = [];
	for (let i = 0; i < tags.length; i++) {
		const tag = tags[i];
		order.push(tag.id);
		tagItems.push(renderItem(tag));
	}
	return {
		items: tagItems,
		order: order,
	};
};
