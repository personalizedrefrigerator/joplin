export interface Gui {
	prompt(initialText: string, promptString?: string, options?: unknown): Promise<string>;
	stdoutMaxWidth(): number;
	isDummy(): boolean;

	showModalOverlay(text: string): void;
	hideModalOverlay(): void;
	maximizeConsole(): void;
	showConsole(): void;

	stdout(text: string): void;
	exit(): void;
}
