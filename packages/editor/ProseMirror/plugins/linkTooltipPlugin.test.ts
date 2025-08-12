import createTestEditor from '../testing/createTestEditor';
import joplinEditorApiPlugin from './joplinEditorApiPlugin';
import linkTooltipPlugin from './linkTooltipPlugin';
import { Editor } from '@tiptap/core';

const getTooltip = () => {
	return document.querySelector('.link-tooltip:not(.-hidden)');
};


let editor: Editor;

describe('linkTooltipPlugin', () => {
	beforeEach(() => {
		editor = createTestEditor({
			parent: document.body,
			html: '<p><a href="#test-heading">Jump to "Test"</a></p><h1>Test heading</h1><p>Done</p>',
			plugins: [
				linkTooltipPlugin,
				joplinEditorApiPlugin,
			],
		});
	});

	afterEach(() => {
		document.body.replaceChildren();
	});

	test('should show a link tooltip when the cursor is in a link', () => {
		editor.commands.setTextSelection(editor.state.doc.nodeSize);
		expect(getTooltip()).toBeFalsy();

		editor.commands.setTextSelection(3);

		expect(getTooltip()).toBeTruthy();
	});

	test('clicking on a hash link should move the cursor to the corresponding header', () => {
		editor.commands.setTextSelection(3);
		getTooltip().querySelector('button').click();

		expect(editor.state.selection.$to.parent.textContent).toBe('Test heading');
	});
});
