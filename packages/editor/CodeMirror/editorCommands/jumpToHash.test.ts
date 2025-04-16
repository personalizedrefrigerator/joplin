import { EditorSelection } from '@codemirror/state';
import createTestEditor from '../testUtil/createTestEditor';
import jumpToHash from './jumpToHash';

describe('jumpToHash', () => {
	test('should jump to elements with id properties', async () => {
		const editor = await createTestEditor(
			'This is an anchor: <a id="test">Test</a>',
			EditorSelection.cursor(1),
			['HTMLTag'],
		);
		expect(jumpToHash(editor, 'test')).toBe(true);
		expect(editor.state.selection.main.anchor).toBe('This is an anchor: <a id="test">'.length);
	});

	test('should jump to Markdown headers', async () => {
		const editor = await createTestEditor(
			'Line 1\n## Line 2',
			EditorSelection.cursor(0),
			['ATXHeading1'],
		);
		expect(jumpToHash(editor, 'line-2')).toBe(true);
		expect(editor.state.selection.main.anchor).toBe(editor.state.doc.length);
	});
});
