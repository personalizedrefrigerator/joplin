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
import { msleep } from '@joplin/utils/time';

interface Props {
	themeId: number;
	query: string;
	onHighlightedWordsChange: (highlightedWords: (ComplexTerm | string)[])=> void;

	initialNumToRender?: number;
}

export const limit = 4;

const selectResults = async (query: string, limit: number, offset: number) => {
	if (!query) return [];

	if (Setting.value('db.ftsEnabled')) {
		const r = await SearchEngineUtils.notesForQuery(query, true, { appendWildCards: true, limit, offset });
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
			offset,
		});
	}
};

const useResults = (props: Props) => {
	const [notes, setNotes] = useState<NoteEntity[]>([]);
	const [isProcessing, setIsProcessing] = useState(false);
	const query = props.query;

	const onUpdateHighlightedWords = useCallback(async (query: string) => {
		const parsedQuery = await SearchEngine.instance().parseQuery(query);
		const highlightedWords = SearchEngine.instance().allParsedQueryTerms(parsedQuery);

		props.onHighlightedWordsChange(highlightedWords);
	}, [props.onHighlightedWordsChange]);

	useQueuedAsyncEffect(async (event) => {
		setIsProcessing(true);

		try {
			await onUpdateHighlightedWords(query);

			let newNotes: NoteEntity[] = [];
			let offset = 0;
			while ((offset === 0 || newNotes.length === limit) && !event.cancelled) {
				newNotes = await selectResults(query, limit, offset);
				offset += limit;

				for (const note of newNotes) {
					notes.push(note);
				}
				// Avoid making any changes to the state when cancelled
				if (!event.cancelled) {
					setNotes(notes => notes.concat(newNotes));
				}

				await msleep(500);
			}
		} finally {
			setIsProcessing(false);
		}
	}, [query], { interval: 200 });

	return {
		notes,
		isPending: isProcessing,
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
	const { notes, isPending } = useResults(props);
	// Don't show the progress bar immediately, only show if the search
	// is taking some time.
	const longRunning = useIsLongRunning(isPending);
	const progressVisible = longRunning;

	// To have the correct height on web, the progress bar needs to be wrapped:
	const progressBar = <View aria-hidden={!progressVisible}>
		<ProgressBar indeterminate={true} visible={progressVisible}/>
	</View>;

	return (
		<View style={containerStyle}>
			{progressBar}
			<FlatList
				data={notes}
				keyExtractor={(item) => item.id}
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
