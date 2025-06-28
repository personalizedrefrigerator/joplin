import * as React from 'react';
import { AccessibilityInfo, FlatList, NativeSyntheticEvent, Platform, Role, ScrollViewProps, StyleSheet, TextInputProps, useWindowDimensions, View, ViewProps, ViewStyle } from 'react-native';
import { TouchableRipple, Text } from 'react-native-paper';
import { connect } from 'react-redux';
import { AppState } from '../utils/types';
import { themeStyle } from './global-style';
import Icon from './Icon';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { _ } from '@joplin/lib/locale';
import SearchInput from './SearchInput';
const naturalCompare = require('string-natural-compare');

export interface Option {
	title: string;
	icon: string|undefined;
	accessibilityHint: string|undefined;
	onPress?: ()=> void;
}

type OnItemSelected = (item: Option)=> void;

interface BaseProps {
	themeId: number;
	items: Option[];
	alwaysExpand: boolean;
	placeholder: string;
	onItemSelected: OnItemSelected;
	style: ViewStyle;
	searchInputProps?: TextInputProps;
	searchResultProps?: ScrollViewProps;
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
				accessibilityHint: undefined,
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
			const hasResults = !!searchResults.length;
			setSelectedIndex(hasResults ? 0 : -1);
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

	const onFirstResult = useCallback(() => {
		setSelectedIndex(0);
	}, []);

	const onLastResult = useCallback(() => {
		setSelectedIndex(searchResults.length - 1);
	}, [searchResults]);

	return { selectedIndex, onNextResult, onPreviousResult, onFirstResult, onLastResult };
};

const useStyles = (themeId: number, showSearchResults: boolean) => {
	const { fontScale } = useWindowDimensions();
	const menuItemHeight = 40 * fontScale;
	const theme = themeStyle(themeId);

	const styles = useMemo(() => {
		const borderRadius = 4;
		const itemMarginVertical = 8;
		return StyleSheet.create({
			root: {
				flexDirection: 'column',
				overflow: 'hidden',

				borderRadius,
				backgroundColor: theme.backgroundColor,
				borderColor: theme.dividerColor,
				borderWidth: showSearchResults ? 1 : 0,
			},
			searchInputContainer: {
				borderRadius,
				backgroundColor: theme.backgroundColor,
				borderColor: theme.dividerColor,
				borderWidth: 1,
				...(showSearchResults ? {
					borderTopWidth: 0,
					borderLeftWidth: 0,
					borderRightWidth: 0,
				} : {}),
			},
			tagSearchHelp: {
				color: theme.colorFaded,
				marginTop: 6,
			},
			searchInput: {
				minHeight: 32,
			},
			searchResults: {
				height: 200,
				flexGrow: 1,
				flexShrink: 1,
			},
			optionIcon: {
				color: theme.color,
				fontSize: theme.fontSizeSmaller,
				textAlign: 'center',
				paddingLeft: 4,
				paddingRight: 4,
			},
			optionLabel: {
				fontSize: theme.fontSize,
				color: theme.color,
				paddingInlineStart: 3,
			},
			optionContent: {
				flexDirection: 'row',
				alignItems: 'center',
				borderRadius,

				height: menuItemHeight - itemMarginVertical,
				marginTop: itemMarginVertical / 2,
				marginBottom: itemMarginVertical / 2,
				paddingHorizontal: 3,
			},
			optionContentSelected: {
				backgroundColor: theme.selectedColor,
			},
		});
	}, [theme, menuItemHeight, showSearchResults]);

	return { menuItemHeight, styles };
};

type Styles = ReturnType<typeof useStyles>['styles'];

interface SearchResultProps {
	text: string;
	icon: string;
	selected: boolean;
	styles: Styles;
}

const SearchResult: React.FC<SearchResultProps> = ({
	text, styles, selected, icon: iconName,
}) => {
	const icon = iconName ? <Icon
		style={styles.optionIcon}
		name={iconName}
		// Description is provided by adjacent text
		accessibilityLabel={null}
	/> : null;

	return (
		<View style={[styles.optionContent, selected && styles.optionContentSelected]}>
			{icon}
			<Text
				style={styles.optionLabel}
			>{text}</Text>
		</View>
	);
};

interface ResultWrapperProps extends ViewProps {
	index: number;
	item: Option;
}

const useSearchResultContainerComponent = (
	onItemSelected: OnItemSelected,
	selectedIndex: number,
	baseId: string,
	resultCount: number,
): React.FC<ResultWrapperProps> => {
	const onItemSelectedRef = useRef(onItemSelected);
	onItemSelectedRef.current = onItemSelected;

	// For the correct accessibility structure, the `TouchableRipple`s need to be siblings.
	return useMemo(() => ({ index, item, children, ...rest }) => (
		<TouchableRipple
			{...rest}
			onPress={() => { onItemSelectedRef.current(item); }}
			// On web, focus is controlled using the arrow keys. On other
			// platforms, arrow key navigation is not available and each item
			// needs to be focusable
			tabIndex={Platform.OS === 'web' ? -1 : undefined}
			role={Platform.OS === 'web' ? 'option' : 'button'}
			accessibilityHint={item.accessibilityHint}
			aria-selected={index === selectedIndex}
			nativeID={`${baseId}-${index}`}
			testID={`search-result-${index}`}
			aria-setsize={resultCount}
			aria-posinset={index + 1}
		><View>{children}</View></TouchableRipple>
	), [selectedIndex, baseId, resultCount]);
};

const useShowSearchResults = (alwaysExpand: boolean, search: string) => {
	const [showSearchResults, setShowSearchResults] = useState(alwaysExpand);

	const showResultsRef = useRef(showSearchResults);
	showResultsRef.current = showSearchResults;

	useEffect(() => {
		setShowSearchResults(true);
	}, [alwaysExpand]);

	useEffect(() => {
		if (search.length > 0 && !showResultsRef.current) {
			setShowSearchResults(true);
		}
	}, [search]);

	return { showSearchResults, setShowSearchResults };
};

const ComboBox: React.FC<Props> = ({
	themeId,
	items,
	onItemSelected: propsOnItemSelected,
	placeholder,
	onAddItem,
	canAddItem,
	style: rootStyle,
	alwaysExpand,
	searchInputProps,
	searchResultProps,
}) => {
	const [search, setSearch] = useState('');
	const { showSearchResults, setShowSearchResults } = useShowSearchResults(alwaysExpand, search);
	const { styles, menuItemHeight } = useStyles(themeId, showSearchResults);

	const results = useSearchResults({
		search,
		setSearch,
		options: items,
		onAddItem,
		canAddItem,
	});
	const { selectedIndex, onNextResult, onPreviousResult, onFirstResult, onLastResult } = useSelectedIndex(search, results);
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
	const SearchResultWrapper = useSearchResultContainerComponent(
		onItemSelected, selectedIndex, baseId, results.length,
	);

	type RenderEvent = { item: Option; index: number };
	const renderItem = useCallback(({ item, index }: RenderEvent) => {
		return <SearchResult
			text={item.title}
			styles={styles}
			selected={index === selectedIndex}
			icon={item.icon ?? ''}
		/>;
	}, [selectedIndex, styles]);

	const onSubmit = useCallback(() => {
		const item = results[selectedIndex];
		if (item) {
			onItemSelected(item);
		}

		if (!alwaysExpand) {
			setShowSearchResults(false);
		}
	}, [onItemSelected, setShowSearchResults, alwaysExpand, results, selectedIndex]);

	// For now, onKeyPress only works on web.
	// See https://github.com/react-native-community/discussions-and-proposals/issues/249
	type KeyPressEvent = { key: string };
	const onKeyPress = useCallback((event: NativeSyntheticEvent<KeyPressEvent>) => {
		const key = event.nativeEvent.key;
		const isDownArrow = key === 'ArrowDown';
		const isUpArrow = key === 'ArrowUp';
		if (!showSearchResults && (isDownArrow || isUpArrow)) {
			setShowSearchResults(true);
			if (isUpArrow) {
				onLastResult();
			} else {
				onFirstResult();
			}
			event.preventDefault();
		} else if (key === 'ArrowDown') {
			onNextResult();
			event.preventDefault();
		} else if (key === 'ArrowUp') {
			onPreviousResult();
			event.preventDefault();
		} else if (key === 'Enter') {
			// This case is necessary on web to prevent the
			// search input from becoming defocused after
			// pressing "enter".
			event.preventDefault();
			onSubmit();
		} else if (key === 'Escape' && !alwaysExpand) {
			setShowSearchResults(false);
			event.preventDefault();
		}
	}, [onSubmit, onNextResult, setShowSearchResults, onPreviousResult, onFirstResult, onLastResult, showSearchResults, alwaysExpand]);

	const webProps = {
		onKeyDown: onKeyPress,
	};
	const activeId = `${baseId}-${selectedIndex}`;
	const searchResults = <FlatList
		ref={listRef}
		data={results}
		{...searchResultProps}

		getItemLayout={(_data, index) => ({
			length: menuItemHeight, offset: menuItemHeight * index, index,
		})}
		CellRendererComponent={SearchResultWrapper}
		// A better role would be 'listbox', but that isn't supported by RN.
		role={Platform.OS === 'web' ? 'listbox' as Role : undefined}
		aria-setsize={results.length}
		aria-activedescendant={activeId}
		nativeID={`menuBox-${baseId}`}

		style={styles.searchResults}
		keyExtractor={optionKeyExtractor}
		extraData={renderItem}
		renderItem={renderItem}
	/>;

	const helpComponent = <Text style={styles.tagSearchHelp}>{_('To create a new tag, type the name and press enter.')}</Text>;

	return <View style={[styles.root, rootStyle]} {...webProps}>
		<SearchInput
			themeId={themeId}
			containerStyle={styles.searchInputContainer}
			style={styles.searchInput}
			value={search}
			onChangeText={setSearch}
			onKeyPress={onKeyPress}
			onSubmitEditing={onSubmit}
			placeholder={placeholder}
			aria-activedescendant={showSearchResults ? activeId : undefined}
			aria-controls={`menuBox-${baseId}`}
			{...searchInputProps}
		/>
		{showSearchResults && searchResults}
		{!showSearchResults && helpComponent}
	</View>;
};


export default connect((state: AppState) => ({
	themeId: state.settings.theme,
}))(ComboBox);
