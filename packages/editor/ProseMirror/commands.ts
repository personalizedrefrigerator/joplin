import { Command as ProseMirrorCommand, TextSelection } from '@tiptap/pm/state';
import { EditorCommandType } from '../types';
import { focus } from '@joplin/lib/utils/focusHandler';
import { getSearchVisible, setSearchVisible } from './plugins/searchPlugin';
import { EditorEventType } from '../events';
import { Editor } from '@tiptap/core';
import { findNext, findPrev, replaceAll, replaceNext } from 'prosemirror-search';
import extractSelectedLinesTo from './utils/extractSelectedLinesTo';
import jumpToHash from './utils/jumpToHash';
import canReplaceSelectionWith from './utils/canReplaceSelectionWith';
import { getEditorApi } from './plugins/joplinEditorApiPlugin';

type TipTapCommand = (editor: Editor, args?: string[])=> boolean;

const extractCurrentLineToParagraph: TipTapCommand = editor => {
	const extractResult = extractSelectedLinesTo(editor.schema, {
		type: editor.schema.nodes.paragraph,
		attrs: {},
	}, editor.state.tr, editor.state.selection);
	if (!extractResult) {
		return false;
	}

	editor.view.dispatch(extractResult.transaction);
	return true;
};

const toggleHeading = (level: 1|2|3|4|5|6): TipTapCommand => {
	return (editor) => {
		extractCurrentLineToParagraph(editor);
		return editor.commands.toggleHeading({ level });
	};
};

const toEditorCommand = (command: ProseMirrorCommand): TipTapCommand => {
	return (editor) => {
		return command(editor.state, tr => editor.view.dispatch(tr), editor.view);
	};
};

const commands: Record<EditorCommandType, TipTapCommand|null> = {
	[EditorCommandType.Undo]: editor => editor.commands.undo(),
	[EditorCommandType.Redo]: editor => editor.commands.redo(),
	[EditorCommandType.SelectAll]: editor => editor.commands.selectAll(),
	[EditorCommandType.Focus]: (editor) => {
		focus('commands::focus', editor.commands);
		return true;
	},
	[EditorCommandType.ToggleBolded]: editor => editor.commands.toggleBold(),
	[EditorCommandType.ToggleItalicized]: editor => editor.commands.toggleItalic(),
	[EditorCommandType.ToggleCode]: editor => editor.commands.toggleCode(),
	[EditorCommandType.ToggleMath]: editor => {
		const state = editor.state;
		const renderer = getEditorApi(state).renderer;
		const selectedText = state.doc.textBetween(state.selection.from, state.selection.to);

		const block = selectedText.includes('\n');
		const nodeType = block ? editor.schema.nodes.joplinEditableBlock : editor.schema.nodes.joplinEditableInline;
		if (canReplaceSelectionWith(state.selection, nodeType)) {
			void (async () => {
				const separator = block ? '$$' : '$';
				const rendered = await renderer.renderMarkupToHtml(`${separator}${selectedText}${separator}`, {
					forceMarkdown: true,
					isFullPageRender: false,
				});

				editor.view.pasteHTML(rendered.html);
			})();

			return true;
		}
		return false;
	},
	[EditorCommandType.ToggleComment]: null,
	[EditorCommandType.DuplicateLine]: null,
	[EditorCommandType.SortSelectedLines]: null,
	[EditorCommandType.ToggleNumberedList]: editor => {
		extractCurrentLineToParagraph(editor);
		return editor.commands.toggleOrderedList();
	},
	[EditorCommandType.ToggleBulletedList]: editor => {
		extractCurrentLineToParagraph(editor);
		return editor.commands.toggleBulletList();
	},
	[EditorCommandType.ToggleCheckList]: editor => {
		extractCurrentLineToParagraph(editor);
		return editor.commands.toggleTaskList();
	},
	[EditorCommandType.ToggleHeading]: toggleHeading(2),
	[EditorCommandType.ToggleHeading1]: toggleHeading(1),
	[EditorCommandType.ToggleHeading2]: toggleHeading(2),
	[EditorCommandType.ToggleHeading3]: toggleHeading(3),
	[EditorCommandType.ToggleHeading4]: toggleHeading(4),
	[EditorCommandType.ToggleHeading5]: toggleHeading(5),
	[EditorCommandType.InsertHorizontalRule]: null,
	[EditorCommandType.ToggleSearch]: toEditorCommand((state, dispatch, view) => {
		const command = setSearchVisible(!getSearchVisible(state));
		return command(state, dispatch, view);
	}),
	[EditorCommandType.ShowSearch]: toEditorCommand(setSearchVisible(true)),
	[EditorCommandType.HideSearch]: toEditorCommand(setSearchVisible(false)),
	[EditorCommandType.FindNext]: toEditorCommand(findNext),
	[EditorCommandType.FindPrevious]: toEditorCommand(findPrev),
	[EditorCommandType.ReplaceNext]: toEditorCommand(replaceNext),
	[EditorCommandType.ReplaceAll]: toEditorCommand(replaceAll),
	[EditorCommandType.EditLink]: (editor) => {
		const state = editor.state;
		const selection = state.selection;
		const schema = editor.schema;

		let linkFrom = -1;
		let linkTo = -1;
		let hasLink = false;
		state.doc.nodesBetween(selection.from, selection.to, (node, position) => {
			const linkMark = node.marks.find(mark => mark.type === schema.marks.link);
			if (linkMark) {
				hasLink = true;
				linkFrom = position;
				linkTo = position + node.nodeSize;
			}
		});
		if (hasLink) {
			editor.view.dispatch(state.tr.setSelection(TextSelection.create(state.doc, linkFrom, linkTo)));
		}

		const onEvent = getEditorApi(state).onEvent;
		onEvent({
			kind: EditorEventType.EditLink,
		});
		return true;
	},
	[EditorCommandType.ScrollSelectionIntoView]: toEditorCommand((state, dispatch) => {
		if (dispatch) {
			dispatch(state.tr.scrollIntoView());
		}
		return true;
	}),
	[EditorCommandType.DeleteLine]: toEditorCommand((state, dispatch) => {
		const anchor = state.selection.$anchor;
		const transaction = state.tr;
		for (let i = anchor.depth; i > 0; i--) {
			if (anchor.node(i).isBlock) {
				const deleteFrom = anchor.before(i);
				const deleteTo = anchor.after(i);
				if (dispatch) {
					dispatch(transaction.deleteRange(deleteFrom, deleteTo));
				}
				return true;
			}
		}

		return false;
	}),
	[EditorCommandType.DeleteToLineEnd]: null,
	[EditorCommandType.DeleteToLineStart]: null,
	[EditorCommandType.IndentMore]: editor => {
		return editor.commands.sinkListItem('listItem') || editor.commands.sinkListItem('taskItem');
	},
	[EditorCommandType.IndentLess]: editor => {
		return editor.commands.liftListItem('listItem') || editor.commands.sinkListItem('taskItem');
	},
	[EditorCommandType.IndentAuto]: null,
	[EditorCommandType.InsertNewlineAndIndent]: null,
	[EditorCommandType.SwapLineUp]: null,
	[EditorCommandType.SwapLineDown]: null,
	[EditorCommandType.GoDocEnd]: null,
	[EditorCommandType.GoDocStart]: null,
	[EditorCommandType.GoLineStart]: null,
	[EditorCommandType.GoLineEnd]: null,
	[EditorCommandType.GoLineUp]: null,
	[EditorCommandType.GoLineDown]: null,
	[EditorCommandType.GoPageUp]: null,
	[EditorCommandType.GoPageDown]: null,
	[EditorCommandType.GoCharLeft]: null,
	[EditorCommandType.GoCharRight]: null,
	[EditorCommandType.UndoSelection]: null,
	[EditorCommandType.RedoSelection]: null,
	[EditorCommandType.SelectedText]: null,
	[EditorCommandType.InsertText]: (editor, [text]) => {
		editor.state.tr.insertText(text);
		return true;
	},
	[EditorCommandType.ReplaceSelection]: null,
	[EditorCommandType.SetText]: null,
	[EditorCommandType.JumpToHash]: (editor, [targetHash]) => {
		return jumpToHash(targetHash)(editor.state, editor.view.dispatch, editor.view);
	},
};

export default commands;
