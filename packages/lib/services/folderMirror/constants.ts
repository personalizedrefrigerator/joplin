import { ModelType } from '../../BaseModel';
import { FolderEntity, NoteEntity, ResourceEntity } from '../database/types';
import { FolderItem } from './types';
const { ALL_NOTES_FILTER_ID } = require('../../reserved-ids.js');

export const resourcesDirName = 'resources';
export const resourceMetadataExtension = '.metadata.yml';
export const resourcesDirId = 'resource1resource1resource111111';
export const resourcesDirItem: FolderItem = {
	id: resourcesDirId,
	title: 'resources',
	parent_id: '',
	deleted_time: 0,
	virtual: true,
	type_: ModelType.Folder,
};

export const baseItem: FolderEntity = {
	id: ALL_NOTES_FILTER_ID,
	title: '',
	type_: ModelType.Folder,
};

type ItemKey = (keyof NoteEntity)|(keyof FolderEntity)|(keyof ResourceEntity);

// These fields will be compared to determine whether an item has changed with respect to a remote item.
export const itemDiffFields: ItemKey[] = [
	'title', 'body', 'icon', 'blob_updated_time', 'is_todo', 'todo_completed',
];

// When a conflict occurs, all other fields are merged by selecting the version in the
// last-updated note.
export const nonMergableFields: ItemKey[] = [ 'body', 'blob_updated_time' ];
