import * as React from 'react';

import { describe, it, beforeEach } from '@jest/globals';
import { render } from '../../utils/testing/testingLibrary';


import Setting from '@joplin/lib/models/Setting';
import { setupDatabaseAndSynchronizer, switchClient, waitFor } from '@joplin/lib/testing/test-utils';
import getWebViewWindowById from '../../utils/testing/getWebViewWindowById';
import TestProviderStack from '../testing/TestProviderStack';
import createMockReduxStore from '../../utils/testing/createMockReduxStore';
import RichTextEditor from './RichTextEditor';
import createTestEditorProps from './testing/createTestEditorProps';
import { EditorEvent, EditorEventType } from '@joplin/editor/events';
import { useCallback } from 'react';

interface WrapperProps {
	onBodyChange?: (newBody: string)=> void;
	noteBody: string;
}

const defaultEditorProps = createTestEditorProps();
const testStore = createMockReduxStore();
const WrappedNoteViewer: React.FC<WrapperProps> = (
	{
		noteBody,
		onBodyChange,
	}: WrapperProps,
) => {
	const onEvent = useCallback((event: EditorEvent) => {
		if (event.kind === EditorEventType.Change) {
			onBodyChange(event.value);
		}
	}, [onBodyChange]);

	return <TestProviderStack store={testStore}>
		<RichTextEditor
			{...defaultEditorProps}
			onEditorEvent={onEvent}
			initialText={noteBody}
		/>
	</TestProviderStack>;
};

const getEditorWindow = async () => {
	return await getWebViewWindowById('RichTextEditor');
};

const mockTyping = (document: Document, window: Window&typeof globalThis, text: string) => {
	const editor = document.querySelector('div[contenteditable]');

	for (const character of text.split('')) {
		editor.dispatchEvent(new window.KeyboardEvent('keydown', { key: character }));
		const paragraphs = editor.querySelectorAll('p');
		(paragraphs[paragraphs.length - 1] ?? editor).appendChild(document.createTextNode(character));
		editor.dispatchEvent(new window.KeyboardEvent('keyup', { key: character }));
	}
};

describe('RichTextEditor', () => {
	beforeEach(async () => {
		await setupDatabaseAndSynchronizer(0);
		await switchClient(0);
		Setting.setValue('editor.codeView', false);
	});

	it('should render basic markdown', async () => {
		render(<WrappedNoteViewer noteBody={'### Test\n\nParagraph `test`'}/>);

		const dom = (await getEditorWindow()).document;
		expect(dom.querySelector('h3').textContent).toBe('Test');
		expect(dom.querySelector('p').textContent).toBe('Paragraph test');
		expect(dom.querySelector('p code').textContent).toBe('test');
	});

	it('should dispatch events when the editor content changes', async () => {
		let body = '**bold** normal';
		render(<WrappedNoteViewer
			noteBody={body}
			onBodyChange={newBody => { body = newBody; }}
		/>);

		const window = await getEditorWindow();
		const dom = window.document;
		mockTyping(dom, window, ' test');

		await waitFor(async () => {
			expect(body.trim()).toBe('**bold** normal test');
		});
	});
});
