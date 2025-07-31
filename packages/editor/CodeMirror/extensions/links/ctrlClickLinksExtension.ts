import { EditorView } from '@codemirror/view';
import referenceLinkStateField from './referenceLinksStateField';
import { ctrlKeyDownField } from '../ctrlKeyStateClassExtension';
import openLink from './utils/openLink';
import getUrlAtPosition from './utils/getUrlAtPosition';
import { syntaxTree } from '@codemirror/language';
import { Prec } from '@codemirror/state';


type OnOpenLink = (url: string, view: EditorView)=> void;


const ctrlClickLinksExtension = (onOpenExternalLink: OnOpenLink) => {
	return [
		ctrlKeyDownField,
		referenceLinkStateField,
		EditorView.theme({
			'&.-ctrl-key-pressed .cm-url, &.-ctrl-key-pressed .tok-link': {
				cursor: 'pointer',
			},
		}),
		Prec.high([
			EditorView.domEventHandlers({
				mousedown: (event: MouseEvent, view: EditorView) => {
					if (event.ctrlKey) {
						const target = view.posAtCoords(event);
						const url = getUrlAtPosition(target, syntaxTree(view.state), view.state);

						if (url) {
							openLink(url.url, view, onOpenExternalLink);
							event.preventDefault();
							return true;
						}
					}
					return false;
				},
			}),
		]),
	];
};

export default ctrlClickLinksExtension;
