import { RemoteItem } from '../../../file-api';

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

export type SyncReportItemCounts = Record<string, number>;
type SyncReportItemSection = Partial<Record<SyncAction, SyncReportItemCounts>>;

export type SyncReport = SyncReportItemSection & {
	fetchingTotal?: number;
	fetchingProcessed?: number;
	cancelling?: boolean;
	startTime?: number;
	completedTime?: number;
	errors?: string[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
export type LogSyncOperationFunction = (action: SyncAction, local?: any, remote?: RemoteItem, message?: string, actionCount?: number)=> void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
export type ApiCallFunction = (fnName: string, ...args: any[])=> Promise<any>;

export const conflictActions: SyncAction[] = [SyncAction.ItemConflict, SyncAction.NoteConflict, SyncAction.ResourceConflict];
