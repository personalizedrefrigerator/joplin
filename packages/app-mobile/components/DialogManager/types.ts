
interface BaseButton {
	text: string;
	style?: 'cancel'|'default'|'destructive';

	checked?: boolean|null;
	iconChecked?: string;
}

export interface PromptButton extends BaseButton {
	onPress?: ()=> void;
}

export interface PromptOptions {
	cancelable?: boolean;
}

export interface MenuChoice<IdType> extends BaseButton {
	id: IdType;
}

export interface DialogControl {
	info(message: string): Promise<void>;
	error(message: string): Promise<void>;
	prompt(title: string, message: string, buttons?: PromptButton[], options?: PromptOptions): void;
	showMenu<IdType>(title: string, choices: MenuChoice<IdType>[]): Promise<IdType>;
}

export enum DialogType {
	Prompt,
	Menu,
}

export interface PromptDialogData {
	type: DialogType;
	key: string;
	title: string;
	message: string;
	buttons: PromptButton[];
	onDismiss: (()=> void)|null;
}

