import { TextSelection } from 'prosemirror-state';
import createTestEditor from '../testing/createTestEditor';
import extractSelectedLinesTo from './extractSelectedLinesTo';

describe('extractSelectedLinesTo', () => {
	test('should extract a single line containing the cursor to a heading', () => {
		const editor = createTestEditor({
			html: '<p>Line 1<br>Line 2<br>Line 3</p>',
		});
		editor.view.dispatch(editor.state.tr.setSelection(
			// Put the cursor in the middle of the second line
			TextSelection.create(editor.state.doc, '<Line 1|Line'.length),
		));

		const { transaction } = extractSelectedLinesTo(
			editor.schema,
			{ type: editor.schema.nodes.heading, attrs: { level: 1 } },
			editor.state.tr,
			editor.state.selection,
		);

		editor.view.dispatch(transaction);

		// The section of the document containing the cursor should now be a new line
		expect(editor.state.doc.toJSON()).toMatchObject({
			content: [
				{
					type: 'paragraph',
					content: [{ type: 'text', text: 'Line 1' }],
				},
				{
					type: 'heading',
					attrs: { level: 1 },
					content: [{ type: 'text', text: 'Line 2' }],
				},
				{
					type: 'paragraph',
					content: [{ type: 'text', text: 'Line 3' }],
				},
			],
		});

		// The selection should still be in the heading
		expect(editor.state.selection.$anchor.parent.toJSON()).toMatchObject({
			type: 'heading',
			attrs: { level: 1 },
		});
	});

	test('should extract multiple lines in the same paragraph to a new paragraph', () => {
		const editor = createTestEditor({
			html: '<p>Line 1<br>Line 2<br>Line 3<br>Line 4</p>',
		});
		editor.view.dispatch(editor.state.tr.setSelection(
			TextSelection.create(
				editor.state.doc,
				// ...from the middle of the second line...
				'<Line 1|Line'.length,
				// ...to the end of the third line
				'<Line 1|Line 2|Line 3'.length,
			),
		));

		const { transaction } = extractSelectedLinesTo(
			editor.schema,
			{ type: editor.schema.nodes.paragraph, attrs: { } },
			editor.state.tr,
			editor.state.selection,
		);

		editor.view.dispatch(transaction);

		// The section of the document containing the cursor should now be a new line
		expect(editor.state.doc.toJSON()).toMatchObject({
			content: [
				{
					type: 'paragraph',
					content: [{ type: 'text', text: 'Line 1' }],
				},
				{
					type: 'paragraph',
					content: [
						{ type: 'text', text: 'Line 2' },
						{ type: 'hardBreak' },
						{ type: 'text', text: 'Line 3' },
					],
				},
				{
					type: 'paragraph',
					content: [{ type: 'text', text: 'Line 4' }],
				},
			],
		});
	});
});
