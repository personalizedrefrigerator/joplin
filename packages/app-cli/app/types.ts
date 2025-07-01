interface KeymapItem {
	keys: string[];
	command: string;
}

export interface Gui {
	prompt(initialText: string, promptString?: string, options?: unknown): Promise<string>;
	stdoutMaxWidth(): number;
	isDummy(): boolean;

	showModalOverlay(text: string): void;
	hideModalOverlay(): void;
	maximizeConsole(): void;
	fullScreen(): void;
	showConsole(): void;
	forceRender(): void;

	termSaveState(): unknown;
	termRestoreState(state: unknown): void;
	keymap(): KeymapItem[];

	stdout(text: string): void;
	exit(): void;
}
