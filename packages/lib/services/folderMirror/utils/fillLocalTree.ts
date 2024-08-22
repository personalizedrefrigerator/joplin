import { ModelType } from '../../../BaseModel';
import Folder, { FolderEntityWithChildren } from '../../../models/Folder';
import Note from '../../../models/Note';
import { ResourceEntity } from '../../database/types';
import { resourcesDirId, resourcesDirItem, resourcesDirName } from '../constants';
import ItemTree, { noOpActionListeners } from '../ItemTree';
import LinkTracker, { LinkType } from '../LinkTracker';
import { ResourceItem } from '../types';


const fillLocalTree = async (itemTree: ItemTree, baseFolderId: string) => {
	const folderFields = ['id', 'icon', 'title', 'parent_id', 'updated_time', 'deleted_time'];
	const isAllNotes = baseFolderId === '';
	const childrenFolders =
			isAllNotes ? await Folder.all({ fields: folderFields }) : await Folder.allChildrenFolders(baseFolderId, folderFields);
	const allFolders = await Folder.allAsTree(childrenFolders, { toplevelId: baseFolderId });

	const processFolders = async (basePath: string, parentId: string, folders: FolderEntityWithChildren[]) => {
		for (const folder of folders) {
			if (folder.deleted_time) continue;

			await itemTree.addItemTo(basePath, folder, noOpActionListeners);
			const folderPath = itemTree.pathFromId(folder.id);
			await processFolders(folderPath, folder.id, folder.children || []);
		}

		const noteFields = ['id', 'title', 'body', 'is_todo', 'todo_due', 'todo_completed', 'parent_id', 'updated_time', 'deleted_time'];
		const childNotes = await Note.allByParentId(parentId, { fields: noteFields });

		for (const note of childNotes) {
			if (note.deleted_time) continue;

			// Add resources first, so that their links get processed first.
			const linkedItems = await Note.linkedItems(note.body ?? '');
			const linkedResources: ResourceEntity[] = linkedItems.filter(item => item.type_ === ModelType.Resource);

			// Sort the linked resources for consistency when testing (default sorting may involve
			// ID ordering).
			linkedResources.sort((a, b) => {
				const createdTimeDiff = a.created_time - b.created_time;
				if (createdTimeDiff !== 0) return createdTimeDiff;
				const updatedTimeDiff = a.updated_time - b.updated_time;
				if (updatedTimeDiff !== 0) return updatedTimeDiff;
				return 0;
			});

			for (const resource of linkedResources) {
				const loadedResource: ResourceItem = { ...resource };
				loadedResource.parent_id = resourcesDirId;
				loadedResource.deleted_time = 0;
				await itemTree.addItemTo(resourcesDirName, resource, noOpActionListeners);
			}

			if (!note.deleted_time) {
				await itemTree.addItemTo(basePath, {...note}, noOpActionListeners);
			}
		}
	};

	await itemTree.addItemAt(resourcesDirName, resourcesDirItem, noOpActionListeners);
	await processFolders('', baseFolderId, allFolders);

	// Convert to path links -- allows comparison with remote notes
	const linkTracker = LinkTracker.fromTree(itemTree);
	for (const [path, item] of [...itemTree.items()]) {
		if (item.type_ === ModelType.Note && 'body' in item) {
			item.body = linkTracker.convertLinkTypes(LinkType.PathLink, item.body, path);
		}
	}
};

export default fillLocalTree;
