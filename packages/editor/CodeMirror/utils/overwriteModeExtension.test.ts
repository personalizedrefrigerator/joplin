import { EditorSelection } from '@codemirror/state';
import createTestEditor from '../testUtil/createTestEditor';
import overwriteModeExtension, { toggleOverwrite } from './overwriteModeExtension';
import typeText from '../testUtil/typeText';
import pressReleaseKey from '../testUtil/pressReleaseKey';

const createEditor = async (initialText: string, defaultEnabled = false) => {
	const editor = await createTestEditor(initialText, EditorSelection.cursor(0), [], [
		overwriteModeExtension,
	]);

	if (defaultEnabled) {
		editor.dispatch({ effects: [toggleOverwrite.of(true)] });
	}

	return editor;
};

describe('overwriteModeExtension', () => {
	test('should be disabled by default', async () => {
		const editor = await createEditor('Test!');

		typeText(editor, 'This should be inserted. ');
		expect(editor.state.doc.toString()).toBe('This should be inserted. Test!');
	});

	test('should overwrite characters while typing', async () => {
		const editor = await createEditor('Test!', true);

		pressReleaseKey(editor, { key: 'A', code: 'KeyA' });
		typeText(editor, 'New');
		expect(editor.state.doc.toString()).toBe('Newt!');
	});

	test('should be toggled by pressing <insert>', async () => {
		const editor = await createEditor('Test!');

		pressReleaseKey(editor, { key: 'Insert', code: 'Insert' });
		typeText(editor, 'Exam');
		expect(editor.state.doc.toString()).toBe('Exam!');

		pressReleaseKey(editor, { key: 'Insert', code: 'Insert' });
		typeText(editor, 'ple');
		expect(editor.state.doc.toString()).toBe('Example!');
	});

	test('should insert text if the cursor is at the end of a line', async () => {
		const editor = await createEditor('\nTest', true);
		typeText(editor, 'Test! This is a test! ');
		typeText(editor, 't');
		typeText(editor, 'e');
		typeText(editor, 's');
		typeText(editor, 't');

		expect(editor.state.doc.toString()).toBe('Test! This is a test! test\nTest');
	});
});
