export interface OnFileEvent {
	uri: string;
	fileName: string;
	type: string|undefined;
}
export type OnFileSavedCallback = (event: OnFileEvent)=> void;
