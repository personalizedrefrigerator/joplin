import { ResourceEntity } from "@joplin/lib/services/database/types";

export interface Attachment {
	uri?: string,
	type?: string,
	fileName?: string,
}

export enum VisibleOverlay {
	None,
	Camera,
	ImageEditor,
}

export interface NoteScreenControl {
	refreshResource(resource: ResourceEntity): Promise<void>;
	attachFile(attachment: Attachment, type: string): Promise<void>;
	setVisibleOverlay(overlay: VisibleOverlay): Promise<void>;
}