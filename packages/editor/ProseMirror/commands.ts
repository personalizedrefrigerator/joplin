import { Command } from 'prosemirror-state';
import { EditorCommandType } from '../types';
import { redo, undo } from 'prosemirror-history';
import { selectAll, toggleMark } from 'prosemirror-commands';
import { focus } from '@joplin/lib/utils/focusHandler';
import schema from './schema';

const commands: Record<EditorCommandType, Command|null> = {
	[EditorCommandType.Undo]: undo,
	[EditorCommandType.Redo]: redo,
	[EditorCommandType.SelectAll]: selectAll,
	[EditorCommandType.Focus]: (_state, _dispatch?, view?) => {
		if (view) {
			focus('commands::focus', view);
		}
		return true;
	},
	[EditorCommandType.ToggleBolded]: toggleMark(schema.marks.strong),
	[EditorCommandType.ToggleItalicized]: null,
	[EditorCommandType.ToggleCode]: null,
	[EditorCommandType.ToggleMath]: null,
	[EditorCommandType.ToggleComment]: null,
	[EditorCommandType.DuplicateLine]: null,
	[EditorCommandType.SortSelectedLines]: null,
	[EditorCommandType.ToggleNumberedList]: null,
	[EditorCommandType.ToggleBulletedList]: null,
	[EditorCommandType.ToggleCheckList]: null,
	[EditorCommandType.ToggleHeading]: null,
	[EditorCommandType.ToggleHeading1]: null,
	[EditorCommandType.ToggleHeading2]: null,
	[EditorCommandType.ToggleHeading3]: null,
	[EditorCommandType.ToggleHeading4]: null,
	[EditorCommandType.ToggleHeading5]: null,
	[EditorCommandType.InsertHorizontalRule]: null,
	[EditorCommandType.ToggleSearch]: null,
	[EditorCommandType.ShowSearch]: null,
	[EditorCommandType.HideSearch]: null,
	[EditorCommandType.FindNext]: null,
	[EditorCommandType.FindPrevious]: null,
	[EditorCommandType.ReplaceNext]: null,
	[EditorCommandType.ReplaceAll]: null,
	[EditorCommandType.EditLink]: null,
	[EditorCommandType.ScrollSelectionIntoView]: null,
	[EditorCommandType.DeleteLine]: null,
	[EditorCommandType.DeleteToLineEnd]: null,
	[EditorCommandType.DeleteToLineStart]: null,
	[EditorCommandType.IndentMore]: null,
	[EditorCommandType.IndentLess]: null,
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
