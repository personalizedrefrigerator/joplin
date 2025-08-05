import * as React from 'react';

import { describe, it, beforeEach } from '@jest/globals';
import { render, waitFor } from '../../utils/testing/testingLibrary';


import Setting from '@joplin/lib/models/Setting';
import { createNoteAndResource, resourceFetcher, setupDatabaseAndSynchronizer, supportDir, switchClient, synchronizerStart } from '@joplin/lib/testing/test-utils';
import getWebViewWindowById from '../../utils/testing/getWebViewWindowById';
import TestProviderStack from '../testing/TestProviderStack';
import createMockReduxStore from '../../utils/testing/createMockReduxStore';
import RichTextEditor from './RichTextEditor';
import createTestEditorProps from './testing/createTestEditorProps';
import { EditorEvent, EditorEventType } from '@joplin/editor/events';
import { RefObject, useCallback, useMemo } from 'react';
import Note from '@joplin/lib/models/Note';
import shim from '@joplin/lib/shim';
import Resource from '@joplin/lib/models/Resource';
import { ResourceInfos } from '@joplin/renderer/types';
import { EditorControl, EditorLanguageType } from '@joplin/editor/types';
import attachedResources from '@joplin/lib/utils/attachedResources';
import { MarkupLanguage } from '@joplin/renderer';
import { NoteEntity } from '@joplin/lib/services/database/types';
import { EditorSettings } from './types';
import { pregQuote } from '@joplin/lib/string-utils';


interface WrapperProps {
	ref?: RefObject<EditorControl>;
	noteResources?: ResourceInfos;
	onBodyChange: (newBody: string)=> void;
	onLinkClick?: (link: string)=> void;
	note?: NoteEntity;
	noteBody: string;
}

const defaultEditorProps = createTestEditorProps();
const testStore = createMockReduxStore();
const WrappedEditor: React.FC<WrapperProps> = (
	{
		noteBody,
		note,
		onBodyChange,
		onLinkClick,
		noteResources,
		ref,
	}: WrapperProps,
) => {
	const onEvent = useCallback((event: EditorEvent) => {
		if (event.kind === EditorEventType.Change) {
			onBodyChange(event.value);
		} else if (event.kind === EditorEventType.FollowLink) {
			if (!onLinkClick) {
				throw new Error('No mock function for onLinkClick registered.');
			}

			onLinkClick(event.link);
		}
	}, [onBodyChange, onLinkClick]);

	const editorSettings = useMemo((): EditorSettings => {
		const isHtml = note?.markup_language === MarkupLanguage.Html;
		return {
			...defaultEditorProps.editorSettings,
			language: isHtml ? EditorLanguageType.Html : EditorLanguageType.Markdown,
		};
	}, [note]);

	return <TestProviderStack store={testStore}>
		<RichTextEditor
			{...defaultEditorProps}
			editorSettings={editorSettings}
			onEditorEvent={onEvent}
			initialText={noteBody}
			noteId={note?.id ?? defaultEditorProps.noteId}
			noteResources={noteResources ?? defaultEditorProps.noteResources}
			editorRef={ref ?? defaultEditorProps.editorRef}
		/>
	</TestProviderStack>;
};

const getEditorWindow = async () => {
	return await getWebViewWindowById('RichTextEditor');
};

type EditorWindow = Window&typeof globalThis;
const getEditorControl = (window: EditorWindow) => {
	if ('joplinRichTextEditor_' in window) {
		return window.joplinRichTextEditor_ as EditorControl;
	}
	throw new Error('No editor control found. Is the editor loaded?');
};

const mockTyping = (window: EditorWindow, text: string) => {
	const document = window.document;
	const editor = document.querySelector('div[contenteditable]');

	for (const character of text.split('')) {
		editor.dispatchEvent(new window.KeyboardEvent('keydown', { key: character }));
		const paragraphs = editor.querySelectorAll('p');
		(paragraphs[paragraphs.length - 1] ?? editor).appendChild(document.createTextNode(character));
		editor.dispatchEvent(new window.KeyboardEvent('keyup', { key: character }));
	}
};

const mockSelectionMovement = (window: EditorWindow, position: number) => {
	getEditorControl(window).select(position, position);
};

const findElement = async function<ElementType extends Element = Element>(selector: string) {
	const window = await getEditorWindow();
	return await waitFor(() => {
		const element = window.document.querySelector<ElementType>(selector);
		expect(element).toBeTruthy();
		return element;
	}, {
		onTimeout: (error) => {
			return new Error(`Failed to find element from selector ${selector}. DOM: ${window?.document?.body?.innerHTML}. \n\nFull error: ${error}`);
		},
	});
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
		expect((await findElement('h3')).textContent).toBe('Test');
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
		mockTyping(window, ' test');

		await waitFor(async () => {
			expect(body.trim()).toBe('**bold** normal test');
		});
	});

	it('should render clickable checkboxes', async () => {
		let body = '- [ ] Test\n- [x] Another test';
		render(<WrappedEditor
			noteBody={body}
			onBodyChange={newBody => { body = newBody; }}
		/>);

		const firstCheckbox = await findElement<HTMLInputElement>('input[type=checkbox]');
		const dom = (await getEditorWindow()).document;
		const getCheckboxLabel = (checkbox: HTMLElement) => {
			const labelledByAttr = checkbox.getAttribute('aria-labelledby');
			const label = dom.getElementById(labelledByAttr);
			return label;
		};

		// Should have the correct labels
		expect(firstCheckbox.getAttribute('aria-labelledby')).toBeTruthy();
		expect(getCheckboxLabel(firstCheckbox).textContent).toBe('Test');

		// Should be correctly checked/unchecked
		expect(firstCheckbox.checked).toBe(false);

		// Clicking a checkbox should toggle it
		firstCheckbox.click();

		await waitFor(async () => {
			// At present, lists are saved as non-tight lists:
			expect(body.trim()).toBe('- [x] Test\n    \n- [x] Another test');
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

		// The resource placeholder should have rendered
		const placeholder = await findElement(`span[data-resource-id=${JSON.stringify(localResource.id)}]`);
		expect([...placeholder.classList]).toContain('not-loaded-resource');

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

		expect(
			await findElement(`img[data-resource-id=${JSON.stringify(localResource.id)}]`),
		).toBeTruthy();
	});

	it('should render clickable internal note links', async () => {
		const linkTarget = await Note.save({ title: 'test' });
		const body = `[link](:/${linkTarget.id})`;
		const onLinkClick = jest.fn();
		render(<WrappedEditor
			noteBody={body}
			onBodyChange={jest.fn()}
			onLinkClick={onLinkClick}
		/>);

		const window = await getEditorWindow();

		const link = await findElement<HTMLAnchorElement>('a[href]');
		expect(link.href).toBe(`:/${linkTarget.id}`);
		mockSelectionMovement(window, 2);

		const tooltipButton = await findElement<HTMLButtonElement>('.link-tooltip:not(.-hidden) > button');
		tooltipButton.click();

		await waitFor(() => {
			expect(onLinkClick).toHaveBeenCalledWith(`:/${linkTarget.id}`);
		});
	});

	it.each([
		MarkupLanguage.Markdown, MarkupLanguage.Html,
	])('should preserve image attachments on edit (case %#)', async (markupLanguage) => {
		const { note, resource } = await createNoteAndResource({ markupLanguage });
		let body = note.body;

		const resources = await attachedResources(body);
		render(<WrappedEditor
			noteBody={note.body}
			note={note}
			onBodyChange={newBody => { body = newBody; }}
			noteResources={resources}
		/>);

		const renderedImage = await findElement<HTMLImageElement>(`img[data-resource-id=${JSON.stringify(resource.id)}]`);
		expect(renderedImage).toBeTruthy();

		const window = await getEditorWindow();
		mockTyping(window, ' test');

		// The rendered image should still have the correct ALT and source
		await waitFor(async () => {
			const editorContent = body.trim();
			if (markupLanguage === MarkupLanguage.Html) {
				expect(editorContent).toMatch(
					new RegExp(`^<p><img src=":/${pregQuote(resource.id)}" alt="${pregQuote(renderedImage.alt)}"[^>]*> test</p>$`),
				);
			} else {
				expect(editorContent).toBe(`![${renderedImage.alt}](:/${resource.id}) test`);
			}
		});
	});

	it.each([
		{ useValidSyntax: false },
		{ useValidSyntax: true },
	])('should preserve inline math on edit (%j)', async ({ useValidSyntax }) => {
		const macros = '\\def\\<{\\langle} \\def\\>{\\rangle}';
		let inlineMath = '| \\< u, v \\> |^2 \\leq \\< u, u \\>\\< v, v \\>';
		// The \\< escapes are invalid without the above custom macro definitions.
		// It should be possible for the editor to preserve invalid math syntax.
		if (useValidSyntax) {
			inlineMath = macros + inlineMath;
		}

		let body = `Inline math: $${inlineMath}$...`;

		render(<WrappedEditor
			noteBody={body}
			onBodyChange={newBody => { body = newBody; }}
		/>);

		const renderedInlineMath = await findElement<HTMLElement>('span.joplin-editable');
		expect(renderedInlineMath).toBeTruthy();

		const window = await getEditorWindow();
		mockTyping(window, ' testing');

		await waitFor(async () => {
			expect(body.trim()).toBe(`Inline math: $${inlineMath}$... testing`);
		});
	});

	it('should preserve block math on edit', async () => {
		let body = 'Test:\n\n$$3^2 + 4^2 = \\sqrt{625}$$\n\nTest.';

		render(<WrappedEditor
			noteBody={body}
			onBodyChange={newBody => { body = newBody; }}
		/>);

		const renderedInlineMath = await findElement<HTMLElement>('div.joplin-editable');
		expect(renderedInlineMath).toBeTruthy();

		const window = await getEditorWindow();
		mockTyping(window, ' testing');

		await waitFor(async () => {
			expect(body.trim()).toBe('Test:\n\n$$\n3^2 + 4^2 = \\sqrt{625}\n$$\n\nTest. testing');
		});
	});

	it('should preserve ==mark==s', async () => {
		let body = '==Test:== Test.';
		render(<WrappedEditor
			noteBody={body}
			onBodyChange={newBody => { body = newBody; }}
		/>);

		const window = await getEditorWindow();
		mockTyping(window, ' Testing!');

		await waitFor(async () => {
			expect(body.trim()).toBe('==Test:== Test. Testing!');
		});
	});
});
