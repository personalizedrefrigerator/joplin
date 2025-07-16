import { buildKeymap as buildBaseKeymap } from 'prosemirror-example-setup';
import schema from '../schema';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';

const keymapExtension = [
	keymap(buildBaseKeymap(schema)),
	keymap(baseKeymap),
];

export default keymapExtension;
