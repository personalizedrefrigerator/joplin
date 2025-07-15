import { createEditor } from '@joplin/editor/CodeMirror';
import { focus } from '@joplin/lib/utils/focusHandler';
import Logger, { TargetType } from '@joplin/utils/Logger';
import WebViewToRNMessenger from '../../utils/ipc/WebViewToRNMessenger';
import { EditorProcessApi, EditorProps, MainProcessApi } from './types';

let loggerCreated = false;
export const setUpLogger = () => {
	if (!loggerCreated) {
		const logger = new Logger();
		logger.addTarget(TargetType.Console);
		logger.setLevel(Logger.LEVEL_WARN);
		Logger.initializeGlobalLogger(logger);
		loggerCreated = true;
	}
};

export const initializeEditor = ({
	parentElementClassName,
	initialText,
	initialNoteId,
	settings,
}: EditorProps) => {
	const messenger = new WebViewToRNMessenger<EditorProcessApi, MainProcessApi>('markdownEditor', null);

	const parentElement = document.getElementsByClassName(parentElementClassName)[0] as HTMLElement;
	if (!parentElement) {
		throw new Error(`Unable to find parent element for editor (class name: ${JSON.stringify(parentElementClassName)})`);
	}

	const control = createEditor(parentElement, {
		initialText,
		initialNoteId,
		settings,

		onPasteFile: async (data) => {
			const reader = new FileReader();
			return new Promise<void>((resolve, reject) => {
				reader.onload = async () => {
					const dataUrl = reader.result as string;
					const base64 = dataUrl.replace(/^data:.*;base64,/, '');
					await messenger.remoteApi.onPasteFile(data.type, base64);
					resolve();
				};
				reader.onerror = () => reject(new Error('Failed to load file.'));

				reader.readAsDataURL(data);
			});
		},

		onLogMessage: message => {
			void messenger.remoteApi.logMessage(message);
		},
		onEvent: (event): void => {
			void messenger.remoteApi.onEditorEvent(event);
		},
	});

	// Works around https://github.com/laurent22/joplin/issues/10047 by handling
	// the text/uri-list MIME type when pasting, rather than sending the paste event
	// to CodeMirror.
	//
	// TODO: Remove this workaround when the issue has been fixed upstream.
	control.on('paste', (_editor, event: ClipboardEvent) => {
		const clipboardData = event.clipboardData;
		if (clipboardData.types.length === 1 && clipboardData.types[0] === 'text/uri-list') {
			event.preventDefault();
			control.insertText(clipboardData.getData('text/uri-list'));
		}
	});

	// Note: Just adding an onclick listener seems sufficient to focus the editor when its background
	// is tapped.
	parentElement.addEventListener('click', (event) => {
		const activeElement = document.querySelector(':focus');
		if (!parentElement.contains(activeElement) && event.target === parentElement) {
			focus('initial editor focus', control);
		}
	});

	messenger.setLocalInterface({
		editor: control,
	});
	return control;
};
