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

export interface PopupControl {
	createPopup(content: ()=> React.ReactNode, type: NotificationType): PopupHandle;
}
