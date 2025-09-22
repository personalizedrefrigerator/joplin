import { EditorSelection, EditorState, Extension, StateEffect } from '@codemirror/state';
import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';
import { EditorSettings, OnEventCallback } from '../../types';
import getSearchState from '../utils/getSearchState';
import { EditorEventType } from '../../events';
import { search, searchPanelOpen, SearchQuery, setSearchQuery } from '@codemirror/search';
import announceSearchMatch from '../vendor/announceSearchMatch';

type CancelEvent = { cancelled: boolean };

export const searchChangeSourceEffect = StateEffect.define<string>({});

const scanForFirstMatch = async (
	state: EditorState,
	query: SearchQuery,
	startPosition: number,
	delayFunction: ()=> Promise<void>,
	cancelEvent: CancelEvent,
) => {
	if (cancelEvent.cancelled) return null;

	const pageSizeChars = 100_000;
	let nextStartPosition = startPosition;

	const nextCursor = () => {
		let endPosition = Math.min(nextStartPosition + pageSizeChars, state.doc.length - 1);
		const endPositionLine = state.doc.lineAt(endPosition);
		// Always search up to the end of the current line to avoid getting partial matches.
		endPosition = endPositionLine.to;

		const cursor = query.getCursor(state, nextStartPosition, endPosition);
		nextStartPosition = endPosition;
		return cursor;
	};

	for (let cursor = nextCursor(); !!cursor && !cancelEvent.cancelled; cursor = nextCursor()) {
		await delayFunction();

		const match = cursor.next();
		if (match?.value && match.value.to && match.value.from !== match.value.to) {
			return match.value;
		}
	}
	return null;
};

const searchExtension = (onEvent: OnEventCallback, settings: EditorSettings): Extension => {
	const onSearchDialogUpdate = (state: EditorState) => {
		const newSearchState = getSearchState(state);

		onEvent({
			kind: EditorEventType.UpdateSearchDialog,
			searchState: newSearchState,
		});
	};

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

		ViewPlugin.fromClass(class {
			private _lastCancelEvent: CancelEvent = { cancelled: false };
			public constructor(private _view: EditorView) {
			}

			private async handleScrollOnQueryChange_(
				query: SearchQuery,
				state: EditorState,
				startState: EditorState,
				cancelEvent: CancelEvent,
			) {
				const wasSearchPanelOpen = searchPanelOpen(startState);
				if (
					!query || query.search.length === 0
					// Avoid auto-scrolling to the search result when first opening the search panel
					|| !wasSearchPanelOpen || !searchPanelOpen(state)
				) {
					return;
				}
				const getFirstMatchAfter = async (pos: number) => {
					const delayFunction = () => {
						return new Promise<void>(resolve => {
							requestAnimationFrame(() => resolve());
						});
					};
					return await scanForFirstMatch(
						state, query, pos, delayFunction, cancelEvent,
					);
				};

				const mainSelection = state.selection.main;
				const firstMatchAfterSelection = await getFirstMatchAfter(mainSelection.from);
				const targetMatch = firstMatchAfterSelection ?? await getFirstMatchAfter(0);

				if (targetMatch && targetMatch.from >= 0 && !cancelEvent.cancelled) {
					this._view.dispatch({
						selection: EditorSelection.single(targetMatch.from, targetMatch.to),
						effects: [
							EditorView.scrollIntoView(targetMatch.from),
							announceSearchMatch(state, targetMatch),
						],
						userEvent: 'select.search',
					});
				}
			}

			public async update(update: ViewUpdate) {
				let lastQueryUpdate: StateEffect<SearchQuery>|null = null;
				for (const tr of update.transactions) {
					const queryUpdate = tr.effects.find(e => e.is(setSearchQuery));
					if (queryUpdate) {
						lastQueryUpdate = queryUpdate;
					}
				}

				const cancelOngoingSearch = () => {
					this._lastCancelEvent.cancelled = true;
				};

				const newCancelEvent = () => {
					cancelOngoingSearch();
					const cancelEvent = { cancelled: false };
					this._lastCancelEvent = cancelEvent;
					return cancelEvent;
				};

				if (!searchPanelOpen(update.state)) {
					cancelOngoingSearch();
				} else if (lastQueryUpdate) {
					void this.handleScrollOnQueryChange_(
						lastQueryUpdate.value, update.state, update.startState, newCancelEvent(),
					);
				}
			}
		}),

		EditorState.transactionExtender.of((tr) => {
			if (tr.effects.some(e => e.is(setSearchQuery)) || searchPanelOpen(tr.state) !== searchPanelOpen(tr.startState)) {
				onSearchDialogUpdate(tr.state);
			}
			return null;
		}),
	];
};

export default searchExtension;
