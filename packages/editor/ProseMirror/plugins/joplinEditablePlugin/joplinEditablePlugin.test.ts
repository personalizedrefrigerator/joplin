import { htmlentities } from '@joplin/utils/html';
import { RenderResult } from '../../../../renderer/types';
import createTestEditor from '../../testing/createTestEditor';
import joplinEditorApiPlugin, { getEditorApi, setEditorApi } from '../joplinEditorApiPlugin';
import joplinEditablePlugin from './joplinEditablePlugin';
import { Second } from '@joplin/utils/time';

const createEditor = (html: string) => {
	return createTestEditor({
		plugins: [
			joplinEditablePlugin,
			joplinEditorApiPlugin,
		],
		html,
	});
};

const findEditButton = (ancestor: Element): HTMLButtonElement => {
	return ancestor.querySelector('.joplin-editable > button.edit');
};

const findEditorDialog = () => {
	const dialog = document.querySelector('dialog.editor-dialog');
	if (!dialog) {
		throw new Error('Could not find an open editor dialog.');
	}

	const editor = dialog.querySelector('textarea');
	const submitButton = dialog.querySelector('button');

	return {
		dialog,
		editor,
		submitButton,
	};
};

describe('joplinEditablePlugin', () => {
	beforeEach(() => {
		jest.useFakeTimers();
		document.body.replaceChildren();
	});

	test.each([
		// Inline
		'<span class="joplin-editable"><pre class="joplin-source">test</pre>rendered</span>',
		// Block
		'<div class="joplin-editable"><pre class="joplin-source">test</pre>rendered</div>',
		// Nested inline
		'<p>Test: <mark><span class="joplin-editable"><pre class="joplin-source">test</pre>rendered</span></mark></p>',
	])('should show an edit button on source blocks (case %#)', (htmlSource) => {
		const editor = createEditor(htmlSource);
		const editButton = findEditButton(editor.view.dom);
		expect(editButton.textContent).toBe('Edit');
	});

	test('clicking the edit button should show an editor dialog', () => {
		const editor = createEditor('<span class="joplin-editable"><pre class="joplin-source">test source</pre>rendered</span>');
		const editButton = findEditButton(editor.view.dom);
		editButton.click();

		// Should show the dialog
		const dialog = findEditorDialog();
		expect(dialog.editor).toBeTruthy();
		expect(dialog.submitButton).toBeTruthy();
	});

	test('editing the content of an editor dialog should update the source block', async () => {
		const editor = createEditor('<div class="joplin-editable"><pre class="joplin-source">test source</pre>rendered</div>');

		// Mock render functions:
		editor.view.dispatch(setEditorApi(editor.state.tr, {
			...getEditorApi(editor.state),
			renderer: {
				renderMarkupToHtml: jest.fn(async source => ({
					html: `<pre class="joplin-source">${htmlentities(source)}</pre><p class="test-content">Mocked!</p></div>`,
				} as RenderResult)),
				renderHtmlToMarkup: jest.fn(),
			},
		}));

		const editButton = findEditButton(editor.view.dom);
		editButton.click();

		const dialog = findEditorDialog();
		dialog.editor.value = 'Updated!';
		dialog.editor.dispatchEvent(new Event('input'));

		// Should update the editor state with the new source immediately.
		expect(editor.state.doc.toJSON()).toMatchObject({
			content: [{
				type: 'joplinEditableBlock',
				attrs: {
					source: 'Updated!',
				},
			}],
		});

		// Should render and update the display within a short amount of time
		await jest.advanceTimersByTimeAsync(Second);
		const renderedEditable = editor.view.dom.querySelector('.joplin-editable');
		// Should render the updated content
		expect(renderedEditable.querySelector('.test-content').innerHTML).toBe('Mocked!');
	});
});
