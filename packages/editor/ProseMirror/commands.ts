import { Command, EditorState, Selection, TextSelection, Transaction } from 'prosemirror-state';
import { EditorCommandType } from '../types';
import { redo, undo } from 'prosemirror-history';
import { autoJoin, selectAll, setBlockType, toggleMark } from 'prosemirror-commands';
import { focus } from '@joplin/lib/utils/focusHandler';
import schema from './schema';
import { liftListItem, sinkListItem, wrapRangeInList } from 'prosemirror-schema-list';
import { NodeType, Attrs, Node } from 'prosemirror-model';
import { getSearchVisible, setSearchVisible } from './plugins/searchExtension';
import { findNext, findPrev, replaceAll, replaceNext } from 'prosemirror-search';
import { getEditorEventHandler } from './plugins/editorEventStatePlugin';
import { EditorEventType } from '../events';
import { canSplit } from 'prosemirror-transform';

const extractSelectedLinesTo = (type: NodeType, attrs: Attrs, transaction: Transaction, selection: Selection) => {
	let firstParagraphPos = -1;
	let lastParagraphPos = -1;
	let foundParagraph = false;
	transaction.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
		if (node.type === schema.nodes.paragraph) {
			if (!foundParagraph) {
				firstParagraphPos = pos;
				lastParagraphPos = pos;
			}

			firstParagraphPos = Math.min(pos, firstParagraphPos);
			lastParagraphPos = Math.max(pos, lastParagraphPos);
			foundParagraph = true;
		}
	});

	if (!foundParagraph) return null;

	const firstParagraphFrom = firstParagraphPos;
	const lastParagraph = transaction.doc.nodeAt(lastParagraphPos);
	const lastParagraphTo = lastParagraphPos + lastParagraph.nodeSize;

	// Find the previous and next <br/>s (or the start/end of the paragraph)
	let fromBreakPosition = firstParagraphFrom;
	let fromBreak: Node|null = null;
	let toBreakPosition = lastParagraphTo;
	let toBreak: Node|null = null;

	transaction.doc.nodesBetween(firstParagraphFrom, lastParagraphTo, (node, pos) => {
		if (node.type === schema.nodes.hard_break) {
			if (pos + node.nodeSize <= selection.from && fromBreakPosition <= pos) {
				fromBreakPosition = Math.max(fromBreakPosition, pos);
				fromBreak = node;
			} else if (pos >= selection.to && toBreakPosition >= pos) {
				toBreakPosition = Math.min(toBreakPosition, pos);
				toBreak = node;
			}
		}
	});

	// Check whether this would result in a change
	if (!fromBreak && !toBreak) {
		const wouldChange = (blockNode: Node) => {
			if (blockNode.type !== type) return true;

			let changesAttributes = false;
			for (const [key, value] of Object.entries(attrs)) {
				if (blockNode.attrs[key] !== value) {
					changesAttributes = true;
				}
			}
			return changesAttributes;
		};

		const candidateNodes = transaction.doc.slice(firstParagraphFrom, lastParagraphTo).content;
		let changes = false;
		for (const node of candidateNodes.content) {
			if (wouldChange(node)) {
				changes = true;
				break;
			}
		}

		if (!changes) {
			return null; // the transaction would do nothing -- skip
		}
	}

	const map = (position: number, associativity?: number) => transaction.mapping.map(position, associativity);
	const replaceBreakWithSplit = (hardBreak: Node, position: number) => {
		if (hardBreak && canSplit(transaction.doc, map(position))) {
			transaction = transaction.split(map(position));
			transaction = transaction.delete(
				map(position),
				map(position + hardBreak.nodeSize),
			);
		}
	};

	// Replace the starting <br/> with a split
	replaceBreakWithSplit(fromBreak, fromBreakPosition);
	// ...and the ending <br/> (if any)
	replaceBreakWithSplit(toBreak, toBreakPosition);

	transaction = transaction.setBlockType(map(fromBreakPosition, 1), map(toBreakPosition, -1), type, attrs);

	// Build a custom final selection -- the default mapping grows the selection, but we want it to shrink,
	// to avoid moving the cursor to the beginning of the content after the current item:
	let finalSelection: Selection = TextSelection.create(transaction.doc, map(toBreakPosition, -1));
	if (!selection.empty) {
		finalSelection = TextSelection.create(transaction.doc, map(fromBreakPosition, 1), map(toBreakPosition, -1));
	}
	transaction = transaction.setSelection(finalSelection);

	return { transaction, finalSelection };
};

const toggleHeading = (level: number): Command => {
	const enableCommand: Command = (state, dispatch) => {
		const result = extractSelectedLinesTo(schema.nodes.heading, { level }, state.tr, state.selection);
		if (!result) return false;

		if (dispatch) {
			dispatch(result.transaction);
		}
		return true;
	};
	const resetCommand = setBlockType(schema.nodes.paragraph);

	return (state, dispatch, view) => {
		if (enableCommand(state, dispatch, view)) {
			return true;
		}
		return resetCommand(state, dispatch, view);
	};
};

const toggleList = (type: NodeType): Command => {
	const enableCommand: Command = autoJoin((state, dispatch) => {
		const extractionResult = extractSelectedLinesTo(
			schema.nodes.paragraph,
			{ },
			state.tr,
			state.selection,
		);
		let transaction = extractionResult?.transaction;
		if (!transaction) {
			transaction = state.tr;
		}

		const selection = extractionResult?.finalSelection ?? state.selection;
		const range = selection.$from.blockRange(selection.$to);
		const result = wrapRangeInList(transaction, range, type);

		if (dispatch && result) {
			dispatch(transaction);
		}

		return result;
	}, [type.name]);
	const liftCommand = liftListItem(schema.nodes.list_item);

	return (state, dispatch, view) => {
		return enableCommand(state, dispatch, view) || liftCommand(state, dispatch, view);
	};
};

const toggleCode: Command = (state, dispatch, view) => {
	return toggleMark(schema.marks.code)(state, dispatch, view) || setBlockType(schema.nodes.paragraph)(state, dispatch, view);
};

const listItemTypes = [schema.nodes.list_item, schema.nodes.task_list_item];

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
	[EditorCommandType.ToggleCheckList]: toggleList(schema.nodes.task_list),
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
	[EditorCommandType.ScrollSelectionIntoView]: (state, dispatch) => {
		if (dispatch) {
			dispatch(state.tr.scrollIntoView());
		}
		return true;
	},
	[EditorCommandType.DeleteLine]: (state, dispatch) => {
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
	},
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
