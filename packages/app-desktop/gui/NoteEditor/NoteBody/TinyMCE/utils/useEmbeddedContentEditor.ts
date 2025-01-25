import { RefObject, useEffect } from 'react';
import type { Editor } from 'tinymce';
import openEditDialog from './openEditDialog';
import { DispatchDidUpdateCallback, TinyMceEditorEvents } from './types';
import { MarkupToHtmlHandler } from '../../../utils/types';

interface Props {
	editor: Editor;
	markupToHtml: RefObject<MarkupToHtmlHandler>;
	dispatchDidUpdate: DispatchDidUpdateCallback;
}

const findEditableContainer = (node: Element) => {
	return node?.closest('.joplin-editable');
};

const useEmbeddedContentEditor = ({
	editor, markupToHtml, dispatchDidUpdate,
}: Props) => {
	useEffect(() => {
		if (!editor) return () => {};

		const openIfEditableBlock = (element: Node) => {
			if (element.nodeName.startsWith('#')) { // e.g. '#text'
				element = element.parentElement;
			}

			const editable = findEditableContainer(element as Element);
			if (editable) {
				openEditDialog(editor, markupToHtml, dispatchDidUpdate, editable);
				return true;
			}
			return false;
		};

		const dblClickHandler = (event: Event) => {
			openIfEditableBlock(event.target as Node);
		};

		const keyDownHandler = (event: KeyboardEvent) => {
			const hasModifiers = event.shiftKey || event.altKey || event.ctrlKey || event.metaKey;
			if (event.code === 'Enter' && !event.isComposing && !hasModifiers) {
				if (openIfEditableBlock(editor.selection.getNode())) {
					event.preventDefault();
				}
			}
		};

		editor.on(TinyMceEditorEvents.KeyDown, keyDownHandler);
		editor.on('DblClick', dblClickHandler);
		return () => {
			editor.off(TinyMceEditorEvents.KeyDown, keyDownHandler);
			editor.off('DblClick', dblClickHandler);
		};
	}, [editor, markupToHtml, dispatchDidUpdate]);
};

export default useEmbeddedContentEditor;
