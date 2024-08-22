import { FolderEntity, NoteEntity, ResourceEntity } from '../database/types';

export type ResourceItem = ResourceEntity & {
	// For compatibility.
	parent_id?: string;
	deleted_time?: number;
};

export type FolderItem = (FolderEntity | NoteEntity | ResourceItem) & { virtual?: boolean };

export type ItemsMatchCallback = (a: FolderItem, b: FolderItem)=>boolean;

export interface TreeLike {
	hasPath(path: string): boolean;
	hashAtPath(path: string): string;
}
