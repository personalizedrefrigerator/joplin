import { EditorSelection, EditorState, Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { EditorSettings, OnEventCallback } from '../../types';
import getSearchState from '../utils/getSearchState';
import { EditorEventType } from '../../events';
import { search, searchPanelOpen, setSearchQuery } from '@codemirror/search';
import announceSearchMatch from '../vendor/announceSearchMatch';

const searchExtension = (onEvent: OnEventCallback, settings: EditorSettings): Extension => {
	const onSearchDialogUpdate = (state: EditorState) => {
		const newSearchState = getSearchState(state);

		onEvent({
			kind: EditorEventType.UpdateSearchDialog,
			searchState: newSearchState,
		});
	};

	const scrollMatchIntoViewOnChangeExtension = EditorState.transactionFilter.of((tr) => {
		const queryUpdate = tr.effects.find(e => e.is(setSearchQuery));
		const query = queryUpdate?.value;
		const wasSearchPanelOpen = searchPanelOpen(tr.startState);
		if (
			query
			&& query.search.length > 0
			// Avoid auto-scrolling to the search result when first opening the search panel
			&& wasSearchPanelOpen && searchPanelOpen(tr.state)
		) {
			const state = tr.state;

			const getFirstMatchAfter = (pos: number) => {
				const iterator = query.getCursor(state, pos);
				const result = iterator.next();
				return !result.done ? result.value : null;
			};

			const mainSelection = state.selection.main;
			const firstMatchAfterSelection = getFirstMatchAfter(mainSelection.from);
			const targetMatch = firstMatchAfterSelection ?? getFirstMatchAfter(0);

			if (targetMatch && targetMatch.from >= 0) {
				return [
					tr,
					{
						selection: EditorSelection.single(targetMatch.from, targetMatch.to),
						effects: [
							EditorView.scrollIntoView(targetMatch.from),
							announceSearchMatch(tr.state, targetMatch),
						],
						userEvent: 'select.search',
					},
				];
			}
		}
		return tr;
	});

	return [
		search(settings.useExternalSearch ? {
			createPanel(_editor: EditorView) {
				return {
					// The actual search dialog is implemented with react native,
					// use a dummy element.
					dom: document.createElement('div'),
					mount() { },
					destroy() { },
				};
			},
		} : undefined),

		scrollMatchIntoViewOnChangeExtension,

		EditorState.transactionExtender.of((tr) => {
			if (tr.effects.some(e => e.is(setSearchQuery)) || searchPanelOpen(tr.state) !== searchPanelOpen(tr.startState)) {
				onSearchDialogUpdate(tr.state);
			}
			return null;
		}),
	];
};

export default searchExtension;
