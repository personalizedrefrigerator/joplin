import { DOMParser as ProseMirrorDomParser } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';
import schema from '../schema';
import { EditorState } from 'prosemirror-state';

interface Options {
	html: string;
}

const createTestEditor = ({ html }: Options) => {
	const htmlDocument = new DOMParser().parseFromString(html, 'text/html');
	const proseMirrorDocument = ProseMirrorDomParser.fromSchema(schema).parse(htmlDocument);
	return new EditorView(null, {
		state: EditorState.create({
			doc: proseMirrorDocument,
			schema,
		}),
	});
};

export default createTestEditor;
