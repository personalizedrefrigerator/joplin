
import { EditorSelection } from '@codemirror/state';
import createTestEditor from '../../testing/createTestEditor';
import moveSelectionWithinBlock from './moveSelectionWithinBlock';

describe('moveSelectionWithinBlock', () => {
	it.each([
		{
			label: 'should move selection within lists',
			doc: '- is a test',
			syntaxNodes: ['BulletList'],
			initial: EditorSelection.range(0, '- is a test'.length),
			expected: EditorSelection.range('- '.length, '- is a test'.length),
		},
	])('$label', async ({ doc, initial, expected, syntaxNodes }) => {
		const editor = await createTestEditor(doc, [initial], syntaxNodes);
		expect(
			moveSelectionWithinBlock(initial, editor.state)
		).toMatchObject({
			from: expected.from,
			to: expected.to,
		});
	});
})