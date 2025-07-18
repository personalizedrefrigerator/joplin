import { EditorView } from '@codemirror/view';
import { EditorTheme } from '../../../types';

const listIndentationExtension = (theme: EditorTheme) => EditorView.theme({
	'& .cm-listItem': {
		// Needs to be !important because the tab-size is directly set on the element style
		// attribute by CodeMirror. And the `EditorState.tabSize` function only accepts a
		// number, while we need a "em" value to make it match the viewer tab size.
		tabSize: `${theme.listTabSize} !important`,
	},
});

export default listIndentationExtension;
