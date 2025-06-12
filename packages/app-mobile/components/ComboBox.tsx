import * as React from 'react';
import { AccessibilityInfo, FlatList, NativeSyntheticEvent, Platform, StyleSheet, View } from 'react-native';
import { TouchableRipple, Text, Searchbar } from 'react-native-paper';
import { connect } from 'react-redux';
import { AppState } from '../utils/types';
import { themeStyle } from './global-style';
import Icon from './Icon';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { _ } from '@joplin/lib/locale';
const naturalCompare = require('string-natural-compare');

interface Option {
	id?: string;
	title: string;
	icon?: string;
	onPress?: ()=> void;
}

interface BaseProps {
	themeId: number;
	items: Option[];
	placeholder: string;
	onItemSelected: (item: Option)=> void;
}

type Props = BaseProps & ({
	onAddItem: ((content: string)=> void)|null;
	canAddItem: (item: string)=> boolean;
}|{
	onAddItem?: undefined;
	canAddItem?: undefined;
});

const optionKeyExtractor = (option: Option) => option.title;

interface SearchResultsOptions {
	search: string;
	setSearch: (search: string)=> void;
	options: Option[];
	onAddItem: null|((content: string)=> void);
	canAddItem: (content: string)=> boolean;
}

const useSearchResults = ({ search, setSearch, options, onAddItem, canAddItem }: SearchResultsOptions) => {
	const results = useMemo(() => {
		return options
			.filter(option => option.title.startsWith(search))
			.sort((a, b) => {
				if (a.title === b.title) return 0;
				// Full matches should go first
				if (a.title === search) return -1;
				if (b.title === search) return 1;
				return naturalCompare(a.title, b.title);
			});
	}, [search, options]);

	const canAdd = (
		!!onAddItem
		&& search.trim()
		&& results[0]?.title !== search
		&& canAddItem(search)
	);

	// Use a ref to prevent unnecessary rerenders if onAddItem changes
	const addCurrentSearch = useRef<()=> void>(()=>{});
	addCurrentSearch.current = () => {
		onAddItem(search);
		AccessibilityInfo.announceForAccessibility(_('Added new: %s', search));
		setSearch('');
	};

	return useMemo(() => {
		if (!canAdd) return results;

		return [
			...results,
			{
				title: _('Add new'),
				icon: 'fas fa-plus',
				onPress: () => {
					addCurrentSearch.current?.();
				},
			},
		];
	}, [canAdd, results]);
};

const useSelectedIndex = (search: string, searchResults: Option[]) => {
	const [selectedIndex, setSelectedIndex] = useState(0);

	useEffect(() => {
		if (search) {
			setSelectedIndex(0);
		} else {
			setSelectedIndex(-1);
		}
	}, [searchResults, search]);

	const onNextResult = useCallback(() => {
		setSelectedIndex(index => {
			return Math.min(index + 1, searchResults.length - 1);
		});
	}, [searchResults]);

	const onPreviousResult = useCallback(() => {
		setSelectedIndex(index => {
			return Math.max(index - 1, 0);
		});
	}, []);

	return { selectedIndex, onNextResult, onPreviousResult };
};

const useStyles = (themeId: number) => {
	return React.useMemo(() => {
		const theme = themeStyle(themeId);
		const borderRadius = 15;
		return StyleSheet.create({
			root: {
				height: 200,
				flexDirection: 'column',
				borderColor: theme.dividerColor,
				borderWidth: 1,
				borderRadius,
				overflow: 'hidden',
			},
			searchInputContainer: {
				borderRadius,
				borderBottomLeftRadius: 0,
				borderBottomRightRadius: 0,
			},
			searchInput: {
				minHeight: 48,
			},
			searchResults: {

			},
			tagIcon: {
				color: theme.color,
				fontSize: theme.fontSize,
				width: 30,
				paddingLeft: 4,
				paddingRight: 4,
			},
			tagLabel: {
				fontSize: theme.fontSize,
				color: theme.color,
				paddingInlineStart: 6,
			},
			menuItemContent: {
				flexDirection: 'row',
				paddingRight: theme.marginRight,
				paddingLeft: theme.marginLeft,
				paddingTop: theme.marginTop,
				paddingBottom: theme.marginBottom,
			},
			menuItemContentSelected: {
				backgroundColor: theme.selectedColor,
			},
		});
	}, [themeId]);
};

type Styles = ReturnType<typeof useStyles>;

interface SearchResultProps {
	text: string;
	icon: string;
	selected: boolean;
	onPress: ()=> void;
	styles: Styles;
	id: string;
	index: number;
	'aria-posinset': number;
	'aria-setsize': number;
}

const SearchResult: React.FC<SearchResultProps> = ({
	text, onPress, styles, selected, id, icon: iconName, ...rest
}) => {
	const icon = iconName ? <Icon
		style={styles.tagIcon}
		name={iconName}
		// Description is provided by adjacent text
		accessibilityLabel={null}
	/> : <View style={styles.tagIcon}/>;

	return <TouchableRipple
		onPress={onPress}
		role='menuitem'
		aria-selected={selected}
		// On web, focus is controlled using the arrow keys. On other
		// platforms, arrow key navigation is not available and each item
		// needs to be focusable
		tabIndex={Platform.OS === 'web' ? -1 : undefined}
		nativeID={id}
		{...rest}
	>
		<View style={[styles.menuItemContent, selected && styles.menuItemContentSelected]}>
			{icon}
			<Text style={styles.tagLabel}>{text}</Text>
		</View>
	</TouchableRipple>;
};


const ComboBox: React.FC<Props> = ({
	themeId, items, onItemSelected: propsOnItemSelected, placeholder, onAddItem, canAddItem,
}) => {
	const styles = useStyles(themeId);
	const [search, setSearch] = useState('');

	const results = useSearchResults({
		search,
		setSearch,
		options: items,
		onAddItem,
		canAddItem,
	});
	const { selectedIndex, onNextResult, onPreviousResult } = useSelectedIndex(search, results);
	const listRef = useRef<FlatList|null>(null);

	const resultsRef = useRef(results);
	resultsRef.current = results;
	useEffect(() => {
		if (resultsRef.current?.length && selectedIndex >= 0) {
			listRef.current?.scrollToIndex({ index: selectedIndex, animated: false, viewPosition: 0.5 });
		}
	}, [selectedIndex]);

	const propsOnItemSelectedRef = useRef(propsOnItemSelected);
	propsOnItemSelectedRef.current = propsOnItemSelected;

	const onItemSelected = useCallback((item: Option) => {
		if (item.onPress) {
			item.onPress();
		} else {
			propsOnItemSelectedRef.current(item);
			setSearch('');
		}
	}, []);

	const baseId = useId();

	type RenderEvent = { item: Option; index: number };
	const renderItem = useCallback(({ item, index }: RenderEvent) => {
		return <SearchResult
			text={item.title}
			onPress={() => {
				onItemSelected(item);
			}}
			styles={styles}
			selected={selectedIndex === index}
			id={`${baseId}-${index}`}
			icon={item.icon ?? ''}
			index={index}
			aria-setsize={results.length}
			aria-posinset={index + 1}
		/>;
	}, [results.length, baseId, selectedIndex, onItemSelected, styles]);

	// For now, onKeyPress only works on web.
	// See https://github.com/react-native-community/discussions-and-proposals/issues/249
	type KeyPressEvent = { key: string };
	const onKeyPress = useCallback((event: NativeSyntheticEvent<KeyPressEvent>) => {
		const key = event.nativeEvent.key;
		if (key === 'ArrowDown') {
			onNextResult();
			event.preventDefault();
		} else if (key === 'ArrowUp') {
			onPreviousResult();
			event.preventDefault();
		} else if (key === 'Enter') {
			const item = results[selectedIndex];
			if (item) {
				onItemSelected(item);
			}
			event.preventDefault();
		}
	}, [selectedIndex, results, onItemSelected, onNextResult, onPreviousResult]);

	const webProps = {
		onKeyDown: onKeyPress,
	};
	return <View style={styles.root} {...webProps}>
		<Searchbar
			style={styles.searchInputContainer}
			inputStyle={styles.searchInput}
			value={search}
			mode='view'
			onChangeText={setSearch}
			onKeyPress={onKeyPress}
			placeholder={placeholder}
			searchAccessibilityLabel={_('Search')}
			clearAccessibilityLabel={_('Clear search')}
			aria-activedescendant={`${baseId}-${selectedIndex}`}
		/>
		<FlatList
			ref={listRef}
			data={results}
			// A better role would be 'listbox', but that isn't supported by RN.
			role={'menu'}
			aria-setsize={results.length}
			aria-activedescendant={`${baseId}-${selectedIndex}`}
			style={styles.searchResults}
			keyExtractor={optionKeyExtractor}
			extraData={renderItem}
			renderItem={renderItem}
		/>
	</View>;
};


export default connect((state: AppState) => ({
	themeId: state.settings.theme,
}))(ComboBox);
