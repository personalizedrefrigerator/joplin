import * as React from 'react';

export type PopupHandle = {
	remove(): void;
	scheduleRemove(delay?: number): void;
};

export enum NotificationType {
	Info = 'info',
	Success = 'success',
	Error = 'error',
}

export interface PopupOptions {
	content: ()=> React.ReactNode;
	type?: NotificationType;
}

export interface PopupControl {
	createPopup(props: PopupOptions): PopupHandle;
}
