import * as React from 'react';
import { ListItem, SetSelectedIndexCallback } from '../types';

import { useCallback, useState, useEffect, useRef } from 'react';
import useAsyncEffect from '@joplin/lib/hooks/useAsyncEffect';
import { msleep, Second } from '@joplin/utils/time';
import { _ } from '@joplin/lib/locale';
import useNowEffect from '@joplin/lib/hooks/useNowEffect';

interface Props {
	listItems: ListItem[];
	selectedIndex: number;
	updateSelectedIndex: SetSelectedIndexCallback;
	focusSidebar: ()=> void;
}

const useTypeAheadAutoClear = (
	setQuery: (query: string)=> void,
	query: string,
) => {
	useAsyncEffect(async (event) => {
		await msleep(Second * 2);
		if (event.cancelled) return;
		setQuery('');
	}, [query]);
};

interface UpdateSelectedIndexProps {
	query: string;
	setQuery: (newQuery: string)=> void;
	selectedIndex: number;
	updateSelectedIndex: SetSelectedIndexCallback;
	listItems: ListItem[];
}

const useUpdateSelectedIndex = (props: UpdateSelectedIndexProps) => {
	const propsRef = useRef(props);
	propsRef.current = props;
	const { query } = props;

	useEffect(() => {
		if (!query) return;

		// Values that need to be up-to-date, but should not cause the useEffect
		// to re-run.
		const { setQuery, selectedIndex, listItems, updateSelectedIndex } = propsRef.current;

		const matches = (item: ListItem) => {
			return item.label.startsWith(query);
		};
		const indexBefore = listItems.slice(0, selectedIndex).findIndex(matches);
		let indexAfter = listItems.slice(selectedIndex).findIndex(matches);
		if (indexAfter !== -1) {
			indexAfter += selectedIndex;
		}
		// Prefer jumping to the next match, rather than the previous
		const matchingIndex = indexAfter !== -1 ? indexAfter : indexBefore;

		if (matchingIndex !== -1) {
			updateSelectedIndex(matchingIndex);
		} else {
			// Reset type-ahead to the last character when there's no match: Type-ahead should restart from
			// the beginning in this case:
			setQuery(query.substring(query.length - 1));
		}
	}, [query]);
};

// See the ARIA Authoring Practices Guide (APG) for how typeahead should work:
// https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
const useTypeAhead = ({ listItems, selectedIndex, updateSelectedIndex, focusSidebar }: Props) => {
	const [query, setQuery] = useState('');
	const inputRef = useRef<HTMLInputElement>(null);

	useTypeAheadAutoClear(
		setQuery,
		query,
	);
	useUpdateSelectedIndex({
		query, setQuery, updateSelectedIndex, listItems, selectedIndex,
	});

	const visible = !!query;
	useNowEffect(() => {
		const hadFocus = inputRef.current?.matches(':focus-within');
		if (!visible && hadFocus) {
			focusSidebar();
		}
		return ()=>{};
	}, [visible, focusSidebar]);

	const onChange: React.ChangeEventHandler<HTMLInputElement> = useCallback((event) => {
		setQuery(event.target.value);
	}, []);
	const typeAheadComponent = visible ? (
		<input
			ref={inputRef}
			className='type-ahead-input'
			aria-label={_('Notebook search')}
			autoFocus
			value={query}
			onChange={onChange}
			type='text'
		/>
	) : null;

	return { setTypeAheadQuery: setQuery, typeAheadComponent, typeAheadEnabled: visible };
};

export default useTypeAhead;
