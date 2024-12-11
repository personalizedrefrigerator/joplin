import { ResourceEntity } from '@joplin/lib/services/database/types';
import { DialogControl } from '../../DialogManager';

export interface PickerResponse {
	uri?: string;
	type?: string;
	fileName?: string;
}

export interface CommandRuntimeProps {
	attachFile(pickerResponse: PickerResponse, fileType: string): Promise<ResourceEntity|null>;
	hideKeyboard(): void;
	insertText(text: string): void;
	setCameraVisible(visible: boolean): void;
	setTagDialogVisible(visible: boolean): void;
	dialogs: DialogControl;
}
