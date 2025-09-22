import { EditorSelection } from '@codemirror/state';
import createTestEditor from '../testing/createTestEditor';
import { getSearchQuery, openSearchPanel, SearchQuery, setSearchQuery } from '@codemirror/search';
import { EditorView } from '@codemirror/view';
import searchExtension from './searchExtension';
import createEditorSettings from '../../testing/createEditorSettings';
import { Second } from '@joplin/utils/time';

const setSearchText = (text: string, view: EditorView) => {
	const oldQuery = getSearchQuery(view.state);
	const query = new SearchQuery({
		search: text,
		caseSensitive: oldQuery.caseSensitive,
		regexp: oldQuery.regexp,
		replace: oldQuery.replace,
	});
	view.dispatch({
		effects: [
			setSearchQuery.of(query),
		],
	});
};

const setSearchTextAndWait = (text: string, view: EditorView) => {
	setSearchText(text, view);
	return jest.advanceTimersByTimeAsync(Second);
};

const createEditor = (initialText: string, cursorPosition: number) => {
	return createTestEditor(initialText, EditorSelection.cursor(cursorPosition), [], [
		searchExtension(()=>{}, createEditorSettings(1)),
	]);
};

describe('searchExtension', () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	test('should auto-scroll to a match when the search changes', async () => {
		const view = await createEditor('Line 1\n\nLine 3\nLine 4', 0);
		openSearchPanel(view);

		const docText = view.state.doc.toString();
		const getSelectionIndex = () => view.state.selection.main.from;

		await setSearchTextAndWait('Line 3', view);
		expect(getSelectionIndex()).toBe(docText.indexOf('Line 3'));

		await setSearchTextAndWait('Line 4', view);
		expect(getSelectionIndex()).toBe(docText.indexOf('Line 4'));
	});

	test('should advance to the next match on change', async () => {
		const view = await createEditor('Match\nMatch2\nMatch22', 0);
		openSearchPanel(view);

		const docText = view.state.doc.toString();
		const getSelectionIndex = () => view.state.selection.main.from;

		await setSearchTextAndWait('Match', view);
		expect(getSelectionIndex()).toBe(0);

		await setSearchTextAndWait('Match2', view);
		expect(getSelectionIndex()).toBe(docText.indexOf('Match2'));

		await setSearchTextAndWait('Match', view);
		expect(getSelectionIndex()).toBe(docText.indexOf('Match2'));
	});
});
