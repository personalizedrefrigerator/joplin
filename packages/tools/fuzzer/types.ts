import type Client from './Client';

export type Json = string|number|Json[]|{ [key: string]: Json };

export type HttpMethod = 'GET'|'POST'|'DELETE'|'PUT'|'PATCH';

export type ItemId = string;
export type NoteData = {
	parentId: ItemId;
	id: ItemId;
	title: string;
	body: string;
};
export type FolderMetadata = {
	parentId: ItemId;
	id: ItemId;
	title: string;
};
export type FolderData = FolderMetadata & {
	childIds: ItemId[];
};
export type TreeItem = NoteData|FolderData;

export const isFolder = (item: TreeItem): item is FolderData => {
	return 'childIds' in item;
};

export interface FuzzContext {
	serverUrl: string;
	baseDir: string;
	execApi: (method: HttpMethod, route: string, debugAction: Json)=> Promise<Json>;
}

export interface ActionableClient {
	createFolder(data: FolderMetadata): Promise<void>;
	deleteFolder(id: string): Promise<void>;
	createNote(data: NoteData): Promise<void>;
	shareFolder(id: string, shareWith: Client): Promise<void>;
	listNotes(): Promise<NoteData[]>;
	listFolders(): Promise<FolderMetadata[]>;
	sync(): Promise<void>;
}

export interface UserData {
	email: string;
	password: string;
}

export type CleanupTask = ()=> Promise<void>;

