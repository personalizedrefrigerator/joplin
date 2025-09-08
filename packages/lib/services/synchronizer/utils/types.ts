import { FunctionPropertiesOf, AsyncReturnTypeOf } from '@joplin/utils/types';
import type { FileApi, RemoteItem } from '../../../file-api';

export enum Dirnames {
	Locks = 'locks',
	Resources = '.resource',
	Temp = 'temp',
}

export enum SyncAction {
	ItemConflict = 'itemConflict',
	NoteConflict = 'noteConflict',
	ResourceConflict = 'resourceConflict',
	CreateRemote = 'createRemote',
	UpdateRemote = 'updateRemote',
	DeleteRemote = 'deleteRemote',
	CreateLocal = 'createLocal',
	UpdateLocal = 'updateLocal',
	DeleteLocal = 'deleteLocal',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
export type LogSyncOperationFunction = (action: SyncAction, local?: any, remote?: RemoteItem, message?: string, actionCount?: number)=> void;

type ApiKey = keyof FunctionPropertiesOf<FileApi>;
export type ApiCallFunction = <Name extends ApiKey> (fnName: Name, ...args: Parameters<FileApi[Name]>)=> AsyncReturnTypeOf<FileApi[Name]>;

export const conflictActions: SyncAction[] = [SyncAction.ItemConflict, SyncAction.NoteConflict, SyncAction.ResourceConflict];
