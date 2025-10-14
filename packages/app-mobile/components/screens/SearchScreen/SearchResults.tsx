import * as React from 'react';
import { useCallback } from 'react';

import { FlatList, View } from 'react-native';
import NoteItem from '../../NoteItem';
import { useEffect, useRef, useState } from 'react';
import useQueuedAsyncEffect from '@joplin/lib/hooks/useQueuedAsyncEffect';
import { NoteEntity } from '@joplin/lib/services/database/types';
import SearchEngineUtils from '@joplin/lib/services/search/SearchEngineUtils';
import Note from '@joplin/lib/models/Note';
import SearchEngine, { ComplexTerm } from '@joplin/lib/services/search/SearchEngine';
import { ProgressBar } from 'react-native-paper';
import shim from '@joplin/lib/shim';
import { _ } from '@joplin/lib/locale';
import { connect } from 'react-redux';
import { AppState } from '../../../utils/types';
import Setting from '@joplin/lib/models/Setting';
import { PrimaryButton } from '../../buttons';

type OnHighlightedWordsChange = (highlightedWords: (ComplexTerm | string)[])=> void;

interface Props {
	themeId: number;
	query: string;
	onHighlightedWordsChange: OnHighlightedWordsChange;

	initialNumToRender?: number;
}

export const baseLimit = 4;

const selectResults = async (query: string, limit: number) => {
	if (!query) return [];

	if (Setting.value('db.ftsEnabled')) {
		const r = await SearchEngineUtils.notesForQuery(query, true, { appendWildCards: true, limit });
		return r.notes;
	} else {
		const p = query.split(' ');
		const temp = [];
		for (let i = 0; i < p.length; i++) {
			const t = p[i].trim();
			if (!t) continue;
			temp.push(t);
		}

		return await Note.previews(null, {
			anywherePattern: `*${temp.join('*')}*`,
			limit,
		});
	}
};

const useLimit = (query: string) => {
	const [limit, setLimit] = useState(baseLimit);
	const [hasMore, setHasMore] = useState(false);

	useEffect(() => {
		setLimit(baseLimit);
		setHasMore(false);
	}, [query]);

	const onIncreaseLimit = useCallback(() => {
		setLimit(limit => limit * 2);
		setHasMore(false);
	}, []);

	const onResultsLoaded = useCallback((resultCount: number) => {
		setHasMore(resultCount === limit);
	}, [limit]);

	return {
		onIncreaseLimit,
		onResultsLoaded,
		limit,
		hasMore,
	};
};

interface UseResultsProps {
	onHighlightedWordsChange: OnHighlightedWordsChange;
	query: string;
}

const useResults = ({ onHighlightedWordsChange, query }: UseResultsProps) => {
	const [notes, setNotes] = useState<NoteEntity[]>([]);
	const [isProcessing, setIsProcessing] = useState(false);
	const { limit, hasMore, onResultsLoaded, onIncreaseLimit } = useLimit(query);

	const onUpdateHighlightedWords = useCallback(async (query: string) => {
		const parsedQuery = await SearchEngine.instance().parseQuery(query);
		const highlightedWords = SearchEngine.instance().allParsedQueryTerms(parsedQuery);

		onHighlightedWordsChange(highlightedWords);
	}, [onHighlightedWordsChange]);

	useQueuedAsyncEffect(async (event) => {
		setIsProcessing(true);

		try {
			const newNotes = await selectResults(query, limit);
			if (event.cancelled) return;
			setNotes(newNotes);
			onResultsLoaded(newNotes.length);
			await onUpdateHighlightedWords(query);
		} finally {
			setIsProcessing(false);
		}
	}, [query, limit], { interval: 200 });

	return {
		notes,
		isPending: isProcessing,
		hasMore,
		onIncreaseLimit,
		limit,
	};
};

const useIsLongRunning = (isPending: boolean) => {
	const [isLongRunning, setIsLongRunning] = useState(false);
	const isPendingRef = useRef(isPending);
	isPendingRef.current = isPending;

	type TimeoutType = ReturnType<typeof shim.setTimeout>;
	const timeoutRef = useRef<TimeoutType|null>(null);

	useEffect(() => {
		if (timeoutRef.current !== null) {
			shim.clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}

		if (isPending) {
			const longRunningTimeout = 1000;
			timeoutRef.current = shim.setTimeout(() => {
				timeoutRef.current = null;
				setIsLongRunning(isPendingRef.current);
			}, longRunningTimeout);
		} else {
			setIsLongRunning(false);
		}
	}, [isPending]);

	return isLongRunning;
};

const containerStyle = { flex: 1 };

const SearchResults: React.FC<Props> = props => {
	const { notes, isPending, hasMore, onIncreaseLimit } = useResults({
		onHighlightedWordsChange: props.onHighlightedWordsChange,
		query: props.query,
	});
	// Don't show the progress bar immediately, only show if the search
	// is taking some time.
	const longRunning = useIsLongRunning(isPending);
	const progressVisible = longRunning;

	// To have the correct height on web, the progress bar needs to be wrapped:
	const progressBar = <View aria-hidden={!progressVisible}>
		<ProgressBar indeterminate={true} visible={progressVisible}/>
	</View>;
	const footer = <PrimaryButton onPress={onIncreaseLimit}>{_('Load more')}</PrimaryButton>;

	return (
		<View style={containerStyle}>
			{progressBar}
			<FlatList
				data={notes}
				keyExtractor={(item) => item.id}
				ListFooterComponent={hasMore && footer}
				initialNumToRender={props.initialNumToRender}
				renderItem={event => <NoteItem note={event.item} />}
			/>
		</View>
	);
};

export default connect((state: AppState) => {
	return {
		themeId: state.settings.theme,
	};
})(SearchResults);
