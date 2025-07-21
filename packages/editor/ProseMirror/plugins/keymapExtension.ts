import { buildKeymap as buildBaseKeymap } from 'prosemirror-example-setup';
import schema from '../schema';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap, chainCommands, exitCode } from 'prosemirror-commands';
import { liftListItem, sinkListItem, splitListItem } from 'prosemirror-schema-list';
import commands from '../commands';
import { EditorCommandType } from '../../types';
import { Command, EditorState, TextSelection } from 'prosemirror-state';
import splitBlockAs from '../vendor/splitBlockAs';

const convertDoubleHardBreakToNewParagraph: Command = (state, dispatch) => {
	const { from, to } = state.selection;
	let foundHardBreak = false;
	let hardBreakFrom = -1;
	state.doc.nodesBetween(from - 1, to, (node, pos) => {
		if (node.type === schema.nodes.hard_break) {
			foundHardBreak = true;
			hardBreakFrom = pos;
		}
		return !foundHardBreak;
	});

	if (foundHardBreak) {
		const updatedSelection = TextSelection.create(state.doc, hardBreakFrom, to);
		const tr = state.tr.setSelection(updatedSelection);
		const splitBlockTransaction = splitBlockAs()(updatedSelection, tr);

		if (splitBlockTransaction && dispatch) {
			dispatch(splitBlockTransaction);
		}

		return !!splitBlockTransaction;
	}

	return false;
};

const listItemTypes = [
	// Apply the list item keymap to all list item types
	// Ref: Default keymap in prosemirror-example-setup.
	schema.nodes.taskListItem, schema.nodes.list_item,
];

const isInEmptyListItem = (state: EditorState) => {
	const anchor = state.selection.$anchor;
	const selectionGrandparent = anchor.node(Math.max(0, anchor.depth - 1));
	const inList = listItemTypes.includes(selectionGrandparent?.type);

	return inList && anchor.parent.content.size === 0;
};

const insertHardBreak: Command = (state, dispatch) => {
	if (isInEmptyListItem(state)) return false;

	if (dispatch) {
		// Default to inserting a hard break. See https://github.com/ProseMirror/prosemirror-example-setup/blob/8c11be6850604081dceda8f36e08d2426875e19a/src/keymap.ts#L77C26-L77C39
		dispatch(
			state.tr.replaceSelectionWith(schema.nodes.hard_break.create())
				.scrollIntoView(),
		);
	}
	return true;
};

const keymapExtension = [
	listItemTypes.map(itemType => keymap({
		'Enter': splitListItem(itemType),
		'Mod-[': liftListItem(itemType),
		'Mod-]': sinkListItem(itemType),
	})),
	keymap({
		'Enter': chainCommands(
			exitCode,
			convertDoubleHardBreakToNewParagraph,
			insertHardBreak,
		),
	}),
	keymap({
		'Mod-k': commands[EditorCommandType.EditLink],
		'Mod-i': commands[EditorCommandType.ToggleItalicized],
		'Mod-`': commands[EditorCommandType.ToggleCode],
		'Mod-f': commands[EditorCommandType.ToggleSearch],
	}),
	keymap(buildBaseKeymap(schema)),
	keymap(baseKeymap),
].flat();

export default keymapExtension;
