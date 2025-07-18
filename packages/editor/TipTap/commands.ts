import { Command as ProseMirrorCommand, TextSelection } from '@tiptap/pm/state';
import { EditorCommandType } from '../types';
import { focus } from '@joplin/lib/utils/focusHandler';
import { getSearchVisible, setSearchVisible } from './plugins/searchExtension';
import { getEditorEventHandler } from './plugins/editorEventStatePlugin';
import { EditorEventType } from '../events';
import { Editor } from '@tiptap/core';
import { findNext, findPrev, replaceAll, replaceNext } from 'prosemirror-search';


type TipTapCommand = (editor: Editor)=> void;

const toggleHeading = (level: 1|2|3|4|5|6): TipTapCommand => {
	return (editor) => {
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
	},
	[EditorCommandType.ToggleBolded]: editor => editor.commands.toggleBold(),
	[EditorCommandType.ToggleItalicized]: editor => editor.commands.toggleItalic(),
	[EditorCommandType.ToggleCode]: editor => editor.commands.toggleCode(),
	[EditorCommandType.ToggleMath]: null,
	[EditorCommandType.ToggleComment]: null,
	[EditorCommandType.DuplicateLine]: null,
	[EditorCommandType.SortSelectedLines]: null,
	[EditorCommandType.ToggleNumberedList]: editor => editor.commands.toggleOrderedList(),
	[EditorCommandType.ToggleBulletedList]: editor => editor.commands.toggleBulletList(),
	[EditorCommandType.ToggleCheckList]: editor => editor.commands.toggleTaskList(),
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

		const onEvent = getEditorEventHandler(state);
		onEvent({
			kind: EditorEventType.EditLink,
		});
	},
	[EditorCommandType.ScrollSelectionIntoView]: null,
	[EditorCommandType.DeleteLine]: null,
	[EditorCommandType.DeleteToLineEnd]: null,
	[EditorCommandType.DeleteToLineStart]: null,
	[EditorCommandType.IndentMore]: editor => editor.commands.sinkListItem('listItem'),
	[EditorCommandType.IndentLess]: editor => editor.commands.liftListItem('listItem'),
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
	[EditorCommandType.InsertText]: null,
	[EditorCommandType.ReplaceSelection]: null,
	[EditorCommandType.SetText]: null,
	[EditorCommandType.JumpToHash]: null,
};

export default commands;
