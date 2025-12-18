
import { RefObject, useMemo } from 'react';
import { CommandValue, DropCommandValue } from '../../utils/types';
import { commandAttachFileToBody } from '../../utils/resourceHandling';
import { _ } from '@joplin/lib/locale';
import { EditorCommandType, EditorControl, UserEventSource } from '@joplin/editor/types';
import Logger from '@joplin/utils/Logger';
import { MarkupLanguage } from '@joplin/renderer';
import { FocusElementOptions } from '../../../../commands/focusElement';

const logger = Logger.create('CodeMirror 6 commands');

interface Props {
	editorRef: RefObject<EditorControl>;
	editorContent: string;

	editorPaste(): void;
	selectionRange: { from: number; to: number };

	visiblePanes: string[];
	contentMarkupLanguage: MarkupLanguage;
}

const useEditorCommands = (props: Props) => {
	const editorRef = props.editorRef;

	return useMemo(() => {
		const selectedText = () => {
			if (!editorRef.current) return '';
			return editorRef.current.getSelection();
		};

		return {
			dropItems: async (cmd: DropCommandValue) => {
				if (cmd.type === 'notes') {
					const text = cmd.markdownTags.join('\n');
					editorRef.current.insertText(text, UserEventSource.Drop);
				} else if (cmd.type === 'files') {
					const newBody = await commandAttachFileToBody(props.editorContent, cmd.paths, {
						createFileURL: !!cmd.createFileURL,
						position: 0, // TODO
						markupLanguage: props.contentMarkupLanguage,
					});
					editorRef.current.updateBody(newBody);
				} else {
					logger.warn('CodeMirror: unsupported drop item: ', cmd);
				}
			},
			selectedText: () => {
				return selectedText();
			},
			selectedHtml: () => {
				return selectedText();
			},
			replaceSelection: (value: string) => {
				return editorRef.current.insertText(value);
			},
			textPaste: () => {
				props.editorPaste();
			},
			textSelectAll: () => {
				return editorRef.current.execCommand(EditorCommandType.SelectAll);
			},
			textLink: async () => {
				// TODO
			},
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
			insertText: (value: any) => editorRef.current.insertText(value),
			attachFile: async () => {
				const newBody = await commandAttachFileToBody(
					props.editorContent, null, { position: props.selectionRange.from, markupLanguage: props.contentMarkupLanguage },
				);
				if (newBody) {
					editorRef.current.updateBody(newBody);
				}
			},
			textHorizontalRule: () => editorRef.current.execCommand(EditorCommandType.InsertHorizontalRule),
			'editor.execCommand': (value: CommandValue) => {
				if (!('args' in value)) value.args = [];

				// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
				if ((editorRef.current as any)[value.name]) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
					const result = (editorRef.current as any)[value.name](...value.args);
					return result;
				} else if (editorRef.current.supportsCommand(value.name)) {
					const result = editorRef.current.execCommand(value.name, ...value.args);
					return result;
				} else {
					logger.warn('CodeMirror execCommand: unsupported command: ', value.name);
				}
			},
			'editor.focus': (_options?: FocusElementOptions) => {
				editorRef.current.focus();
			},
			search: () => {
				return editorRef.current.execCommand(EditorCommandType.ShowSearch);
			},
		};
	}, [
		props.visiblePanes, props.editorContent, props.editorPaste,
		props.selectionRange,
		props.contentMarkupLanguage,
		editorRef,
	]);
};
export default useEditorCommands;
