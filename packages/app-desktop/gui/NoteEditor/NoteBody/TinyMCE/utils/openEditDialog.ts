import { _ } from '@joplin/lib/locale';
import { MarkupToHtml } from '@joplin/renderer';
import { TinyMceEditorEvents } from './types';
import { Editor } from 'tinymce';
import Setting from '@joplin/lib/models/Setting';
import { focus } from '@joplin/lib/utils/focusHandler';
const taboverride = require('taboverride');

interface SourceInfo {
	openCharacters: string;
	closeCharacters: string;
	content: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	node: any;
	language: string;
}

const createTextAreaKeyListeners = () => {
	let hasListeners = true;

	// Selectively enable/disable taboverride based on settings -- remove taboverride
	// when pressing tab if tab is expected to move focus.
	const onKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Tab') {
			if (Setting.value('editor.tabMovesFocus')) {
				taboverride.utils.removeListeners(event.currentTarget);
				hasListeners = false;
			} else {
				// Prevent the default focus-changing behavior
				event.preventDefault();
				requestAnimationFrame(() => {
					focus('openEditDialog::dialogTextArea_keyDown', event.target);
				});
			}
		}
	};

	const onKeyUp = (event: KeyboardEvent) => {
		if (event.key === 'Tab' && !hasListeners) {
			taboverride.utils.addListeners(event.currentTarget);
			hasListeners = true;
		}
	};

	return { onKeyDown, onKeyUp };
};

interface TextAreaTabHandler {
	remove(): void;
}

// Allows pressing tab in a textarea to input an actual tab (instead of changing focus)
// taboverride will take care of actually inserting the tab character, while the keydown
// event listener will override the default behaviour, which is to focus the next field.
function enableTextAreaTab(document: Document): TextAreaTabHandler {
	type RemoveCallback = ()=> void;
	const removeCallbacks: RemoveCallback[] = [];

	const textAreas = document.querySelectorAll<HTMLTextAreaElement>('.tox-textarea');
	for (const textArea of textAreas) {
		const { onKeyDown, onKeyUp } = createTextAreaKeyListeners();
		textArea.addEventListener('keydown', onKeyDown);
		textArea.addEventListener('keyup', onKeyUp);

		// Enable/disable taboverride **after** the listeners above.
		// The custom keyup/keydown need to have higher precedence.
		taboverride.set(textArea, true);

		removeCallbacks.push(() => {
			taboverride.set(textArea, false);
			textArea.removeEventListener('keyup', onKeyUp);
			textArea.removeEventListener('keydown', onKeyDown);
		});
	}

	return {
		remove: () => {
			for (const callback of removeCallbacks) {
				callback();
			}
		},
	};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
function findBlockSource(node: any): SourceInfo {
	const sources = node.getElementsByClassName('joplin-source');
	if (!sources.length) throw new Error('No source for node');
	const source = sources[0];

	return {
		openCharacters: source.getAttribute('data-joplin-source-open'),
		closeCharacters: source.getAttribute('data-joplin-source-close'),
		content: source.textContent,
		node: source,
		language: source.getAttribute('data-joplin-language') || '',
	};
}

function newBlockSource(language = '', content = '', previousSource: SourceInfo = null): SourceInfo {
	let fence = '```';

	if (language === 'katex') {
		if (previousSource && previousSource.openCharacters === '$') {
			fence = '$';
		} else {
			fence = '$$';
		}
	}

	const fenceLanguage = language === 'katex' ? '' : language;

	return {
		openCharacters: fence === '$' ? '$' : `\n${fence}${fenceLanguage}\n`,
		closeCharacters: fence === '$' ? '$' : `\n${fence}\n`,
		content: content,
		node: null,
		language: language,
	};
}

function editableInnerHtml(html: string): string {
	const temp = document.createElement('div');
	temp.innerHTML = html;
	const editable = temp.getElementsByClassName('joplin-editable');
	if (!editable.length) throw new Error(`Invalid joplin-editable: ${html}`);
	return editable[0].innerHTML;
}

// eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any -- Old code before rule was applied, Old code before rule was applied
export default function openEditDialog(editor: Editor, markupToHtml: any, dispatchDidUpdate: Function, editable: any) {
	const source = editable ? findBlockSource(editable) : newBlockSource();

	const containerDocument = editor.getContainer().ownerDocument;
	let tabHandler: TextAreaTabHandler|null = null;

	editor.windowManager.open({
		title: _('Edit'),
		size: 'large',
		initialData: {
			codeTextArea: source.content,
			languageInput: source.language,
		},
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		onSubmit: async (dialogApi: any) => {
			const newSource = newBlockSource(dialogApi.getData().languageInput, dialogApi.getData().codeTextArea, source);
			const md = `${newSource.openCharacters}${newSource.content}${newSource.closeCharacters}`;
			const result = await markupToHtml.current(MarkupToHtml.MARKUP_LANGUAGE_MARKDOWN, md, { bodyOnly: true });

			// markupToHtml will return the complete editable HTML, but we only
			// want to update the inner HTML, so as not to break additional props that
			// are added by TinyMCE on the main node.

			if (editable) {
				editable.innerHTML = editableInnerHtml(result.html);
			} else {
				editor.insertContent(result.html);
			}

			dialogApi.close();
			editor.fire(TinyMceEditorEvents.JoplinChange);
			dispatchDidUpdate(editor);
		},
		onClose: () => {
			tabHandler?.remove();
		},
		body: {
			type: 'panel',
			items: [
				{
					type: 'input',
					name: 'languageInput',
					label: 'Language',
					// Katex is a special case with special opening/closing tags
					// and we don't currently handle switching the language in this case.
					enabled: source.language !== 'katex',
				},
				{
					type: 'textarea',
					name: 'codeTextArea',
				},
			],
		},
		buttons: [
			{
				type: 'submit',
				text: 'OK',
			},
		],
	});

	window.requestAnimationFrame(() => {
		tabHandler = enableTextAreaTab(containerDocument);
	});
}
