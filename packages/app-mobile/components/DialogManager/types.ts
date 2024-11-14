
export interface PromptButton {
	text: string;
	onPress?: ()=> void;
	style?: 'cancel'|'default'|'destructive';
}

export interface PromptOptions {
	cancelable?: boolean;
}

export interface MenuChoice<IdType> {
	text: string;
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

