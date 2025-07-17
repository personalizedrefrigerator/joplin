import { buildKeymap as buildBaseKeymap } from 'prosemirror-example-setup';
import schema from '../schema';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';
import { liftListItem, sinkListItem, splitListItem } from 'prosemirror-schema-list';
import commands from '../commands';
import { EditorCommandType } from '../../types';

const keymapExtension = [
	[
		// Apply the list item keymap to all list item types
		// Ref: Default keymap in prosemirror-example-setup.
		schema.nodes.taskListItem, schema.nodes.list_item,
	].map(itemType => keymap({
		'Enter': splitListItem(itemType),
		'Mod-[': liftListItem(itemType),
		'Mod-]': sinkListItem(itemType),
	})),
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
