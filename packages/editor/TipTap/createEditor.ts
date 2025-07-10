import { Editor } from "@tiptap/core";
import { ContentScriptData, EditorCommandType, EditorControl, EditorProps, EditorSettings, SearchState, UpdateBodyOptions, UserEventSource } from "../types";
import StarterKit from "@tiptap/starter-kit";

const createEditor = (
	parentElement: HTMLElement, props: EditorProps,
): EditorControl => {

	const editor = new Editor({
		element: parentElement,
		extensions: [StarterKit],
		content: 'TEST',
	});

	return {
		supportsCommand: function (name: EditorCommandType | string): boolean | Promise<boolean> {
			throw new Error("Function not implemented.");
		},
		execCommand: function (name: EditorCommandType | string, ...args: any[]): void | Promise<any> {
			throw new Error("Function not implemented.");
		},
		undo: function (): void {
			throw new Error("Function not implemented.");
		},
		redo: function (): void {
			throw new Error("Function not implemented.");
		},
		select: function (anchor: number, head: number): void {
			throw new Error("Function not implemented.");
		},
		setScrollPercent: function (fraction: number): void {
			throw new Error("Function not implemented.");
		},
		insertText: function (text: string, source?: UserEventSource): void {
			throw new Error("Function not implemented.");
		},
		updateBody: function (newBody: string, UpdateBodyOptions?: UpdateBodyOptions): void {
			throw new Error("Function not implemented.");
		},
		updateSettings: function (newSettings: EditorSettings): void {
			throw new Error("Function not implemented.");
		},
		updateLink: function (label: string, url: string): void {
			throw new Error("Function not implemented.");
		},
		setSearchState: function (state: SearchState): void {
			throw new Error("Function not implemented.");
		},
		setContentScripts: function (plugins: ContentScriptData[]): Promise<void> {
			throw new Error("Function not implemented.");
		}
	};
};

export default createEditor;