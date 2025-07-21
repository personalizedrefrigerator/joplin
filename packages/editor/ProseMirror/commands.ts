import { Command, EditorState } from 'prosemirror-state';
import { EditorCommandType } from '../types';
import { redo, undo } from 'prosemirror-history';
import { selectAll, setBlockType, toggleMark } from 'prosemirror-commands';
import { focus } from '@joplin/lib/utils/focusHandler';
import schema from './schema';
import { liftListItem, sinkListItem, wrapInList } from 'prosemirror-schema-list';
import { NodeType } from 'prosemirror-model';
import { getSearchVisible, setSearchVisible } from './plugins/searchExtension';
import { findNext, findPrev, replaceAll, replaceNext } from 'prosemirror-search';
import { getEditorEventHandler } from './plugins/editorEventStatePlugin';
import { EditorEventType } from '../events';

const toggleHeading = (level: number): Command => {
	const enableCommand = setBlockType(schema.nodes.heading, { level });
	const resetCommand = setBlockType(schema.nodes.paragraph);

	return (state, dispatch, view) => {
		if (enableCommand(state, dispatch, view)) {
			return true;
		}
		return resetCommand(state, dispatch, view);
	};
};

const toggleList = (type: NodeType): Command => {
	const enableCommand = wrapInList(type);
	const liftCommand = liftListItem(schema.nodes.list_item);

	return (state, dispatch, view) => {
		return enableCommand(state, dispatch, view) || liftCommand(state, dispatch, view);
	};
};

const toggleCode: Command = (state, dispatch, view) => {
	return toggleMark(schema.marks.code)(state, dispatch, view) || setBlockType(schema.nodes.paragraph)(state, dispatch, view);
};

const listItemTypes = [schema.nodes.list_item, schema.nodes.taskListItem];

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
	[EditorCommandType.ToggleItalicized]: toggleMark(schema.marks.emphasis),
	[EditorCommandType.ToggleCode]: toggleCode,
	[EditorCommandType.ToggleMath]: null,
	[EditorCommandType.ToggleComment]: null,
	[EditorCommandType.DuplicateLine]: null,
	[EditorCommandType.SortSelectedLines]: null,
	[EditorCommandType.ToggleNumberedList]: toggleList(schema.nodes.ordered_list),
	[EditorCommandType.ToggleBulletedList]: toggleList(schema.nodes.bullet_list),
	[EditorCommandType.ToggleCheckList]: toggleList(schema.nodes.taskList),
	[EditorCommandType.ToggleHeading]: toggleHeading(2),
	[EditorCommandType.ToggleHeading1]: toggleHeading(1),
	[EditorCommandType.ToggleHeading2]: toggleHeading(2),
	[EditorCommandType.ToggleHeading3]: toggleHeading(3),
	[EditorCommandType.ToggleHeading4]: toggleHeading(4),
	[EditorCommandType.ToggleHeading5]: toggleHeading(5),
	[EditorCommandType.InsertHorizontalRule]: null,
	[EditorCommandType.ToggleSearch]: (state, dispatch, view) => {
		const command = setSearchVisible(!getSearchVisible(state));
		return command(state, dispatch, view);
	},
	[EditorCommandType.ShowSearch]: setSearchVisible(true),
	[EditorCommandType.HideSearch]: setSearchVisible(false),
	[EditorCommandType.FindNext]: findNext,
	[EditorCommandType.FindPrevious]: findPrev,
	[EditorCommandType.ReplaceNext]: replaceNext,
	[EditorCommandType.ReplaceAll]: replaceAll,
	[EditorCommandType.EditLink]: (state: EditorState, dispatch) => {
		if (dispatch) {
			const onEvent = getEditorEventHandler(state);
			onEvent({
				kind: EditorEventType.EditLink,
			});
		}

		return true;
	},
	[EditorCommandType.ScrollSelectionIntoView]: null,
	[EditorCommandType.DeleteLine]: null,
	[EditorCommandType.DeleteToLineEnd]: null,
	[EditorCommandType.DeleteToLineStart]: null,
	[EditorCommandType.IndentMore]: (state, dispatch, view) => {
		return listItemTypes.some(type => sinkListItem(type)(state, dispatch, view));
	},
	[EditorCommandType.IndentLess]: (state, dispatch, view) => {
		return listItemTypes.some(type => liftListItem(type)(state, dispatch, view));
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
	[EditorCommandType.InsertText]: null,
	[EditorCommandType.ReplaceSelection]: null,
	[EditorCommandType.SetText]: null,
	[EditorCommandType.JumpToHash]: null,
};

export default commands;
