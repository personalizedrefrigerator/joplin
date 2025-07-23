import * as React from 'react';

import { describe, it, beforeEach } from '@jest/globals';
import { render, waitFor } from '../../utils/testing/testingLibrary';


import Setting from '@joplin/lib/models/Setting';
import { resourceFetcher, setupDatabaseAndSynchronizer, supportDir, switchClient, synchronizerStart } from '@joplin/lib/testing/test-utils';
import getWebViewWindowById from '../../utils/testing/getWebViewWindowById';
import TestProviderStack from '../testing/TestProviderStack';
import createMockReduxStore from '../../utils/testing/createMockReduxStore';
import RichTextEditor from './RichTextEditor';
import createTestEditorProps from './testing/createTestEditorProps';
import { EditorEvent, EditorEventType } from '@joplin/editor/events';
import { RefObject, useCallback } from 'react';
import Note from '@joplin/lib/models/Note';
import shim from '@joplin/lib/shim';
import Resource from '@joplin/lib/models/Resource';
import { ResourceInfos } from '@joplin/renderer/types';
import { EditorControl } from './types';

interface WrapperProps {
	ref?: RefObject<EditorControl>;
	noteResources?: ResourceInfos;
	onBodyChange: (newBody: string)=> void;
	noteBody: string;
}

const defaultEditorProps = createTestEditorProps();
const testStore = createMockReduxStore();
const WrappedEditor: React.FC<WrapperProps> = (
	{
		noteBody,
		onBodyChange,
		noteResources,
		ref,
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
			noteResources={noteResources ?? defaultEditorProps.noteResources}
			editorRef={ref ?? defaultEditorProps.editorRef}
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

const createRemoteResourceAndNote = async (remoteClientId: number) => {
	await setupDatabaseAndSynchronizer(remoteClientId);
	await switchClient(remoteClientId);

	let note = await Note.save({ title: 'Note 1', parent_id: '' });
	note = await shim.attachFileToNote(note, `${supportDir}/photo.jpg`);

	const allResources = await Resource.all();
	expect(allResources.length).toBe(1);
	const resourceId = allResources[0].id;

	await synchronizerStart();
	await switchClient(0);
	await synchronizerStart();


	return { noteId: note.id, resourceId };
};

describe('RichTextEditor', () => {
	beforeEach(async () => {
		await setupDatabaseAndSynchronizer(0);
		await switchClient(0);
		Setting.setValue('editor.codeView', false);
	});

	it('should render basic markdown', async () => {
		render(<WrappedEditor
			noteBody={'### Test\n\nParagraph `test`'}
			onBodyChange={jest.fn()}
		/>);

		const dom = (await getEditorWindow()).document;
		expect(dom.querySelector('h3').textContent).toBe('Test');
		expect(dom.querySelector('p').textContent).toBe('Paragraph test');
		expect(dom.querySelector('p code').textContent).toBe('test');
	});

	it('should dispatch events when the editor content changes', async () => {
		let body = '**bold** normal';
		render(<WrappedEditor
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

	it('should reload resource placeholders when the corresponding item downloads', async () => {
		Setting.setValue('sync.resourceDownloadMode', 'manual');
		const { noteId, resourceId } = await createRemoteResourceAndNote(1);

		const note = await Note.load(noteId);
		const localResource = await Resource.load(resourceId);
		let localState = await Resource.localState(localResource);
		expect(localState.fetch_status).toBe(Resource.FETCH_STATUS_IDLE);

		const editorRef = React.createRef<EditorControl>();
		const component = render(
			<WrappedEditor
				noteBody={note.body}
				noteResources={{ [localResource.id]: { localState, item: localResource } }}
				onBodyChange={jest.fn()}
				ref={editorRef}
			/>,
		);

		const editorWindow = await getEditorWindow();
		const dom = editorWindow.document;

		// The resource placeholder should have rendered
		await waitFor(() => {
			const placeholders = dom.querySelectorAll<HTMLElement>(`span[data-resource-id=${JSON.stringify(localResource.id)}]`);
			expect(placeholders).toHaveLength(1);

			const resourcePlaceholder = placeholders[0];
			expect([...resourcePlaceholder.classList]).toContain('not-loaded-resource');
		});

		await resourceFetcher().markForDownload([localResource.id]);

		await waitFor(async () => {
			localState = await Resource.localState(localResource.id);
			expect(localState).toMatchObject({ fetch_status: Resource.FETCH_STATUS_DONE });
		});

		component.rerender(
			<WrappedEditor
				noteBody={note.body}
				noteResources={{ [localResource.id]: { localState, item: localResource } }}
				onBodyChange={jest.fn()}
				ref={editorRef}
			/>,
		);
		editorRef.current.onResourceDownloaded(localResource.id);

		await waitFor(() => {
			const renderedImage = dom.querySelector<HTMLElement>(
				`img[data-resource-id=${JSON.stringify(localResource.id)}]`,
			);
			expect(renderedImage).toBeTruthy();
		});
	});
});
