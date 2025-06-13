import * as React from 'react';
import { AccessibilityInfo, FlatList, NativeSyntheticEvent, Platform, Role, StyleSheet, useWindowDimensions, View, ViewProps, ViewStyle } from 'react-native';
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

type OnItemSelected = (item: Option)=> void;

interface BaseProps {
	themeId: number;
	items: Option[];
	placeholder: string;
	onItemSelected: OnItemSelected;
	style: ViewStyle;
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
	const { fontScale } = useWindowDimensions();
	const menuItemHeight = 48 * fontScale;

	const styles = React.useMemo(() => {
		const theme = themeStyle(themeId);
		const borderRadius = 15;
		return StyleSheet.create({
			root: {
				height: 300,
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
				backgroundColor: theme.backgroundColor,
			},
			searchInput: {
				minHeight: menuItemHeight,
				color: theme.color,
			},
			searchResults: {
				flexGrow: 1,
				flexShrink: 1,
			},
			optionIcon: {
				color: theme.color,
				fontSize: theme.fontSize,
				width: 30,
				paddingLeft: 4,
				paddingRight: 4,
			},
			optionLabel: {
				fontSize: theme.fontSize,
				color: theme.color,
				paddingInlineStart: 6,
			},
			optionContent: {
				flexDirection: 'row',
				paddingRight: theme.marginRight,
				paddingLeft: theme.marginLeft,
				height: menuItemHeight,
				alignItems: 'center',
			},
			optionContentSelected: {
				backgroundColor: theme.selectedColor,
			},
		});
	}, [themeId, menuItemHeight]);

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
	/> : <View style={styles.optionIcon}/>;

	return (
		<View style={[styles.optionContent, selected && styles.optionContentSelected]}>
			{icon}
			<Text style={styles.optionLabel}>{text}</Text>
		</View>
	);
};

interface ResultWrapperProps extends ViewProps {
	index: number;
	item: Option;
}

const useSearchResultWrapper = (
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
			role={Platform.OS === 'web' ? 'option' : 'menuitem'}
			aria-selected={index === selectedIndex}
			nativeID={`${baseId}-${index}`}
			aria-setsize={resultCount}
			aria-posinset={index + 1}
		><View>{children}</View></TouchableRipple>
	), [selectedIndex, baseId, resultCount]);
};


const ComboBox: React.FC<Props> = ({
	themeId, items, onItemSelected: propsOnItemSelected, placeholder, onAddItem, canAddItem, style: rootStyle,
}) => {
	const { styles, menuItemHeight } = useStyles(themeId);
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
	const SearchResultWrapper = useSearchResultWrapper(
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
	const activeId = `${baseId}-${selectedIndex}`;
	return <View style={[styles.root, rootStyle]} {...webProps}>
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
			aria-activedescendant={activeId}
			aria-controls={`menuBox-${baseId}`}
		/>
		<FlatList
			ref={listRef}
			data={results}
			getItemLayout={(_data, index) => ({
				length: menuItemHeight, offset: menuItemHeight * index, index,
			})}
			CellRendererComponent={SearchResultWrapper}
			// A better role would be 'listbox', but that isn't supported by RN.
			role={Platform.OS === 'web' ? 'listbox' as Role : 'menu'}
			aria-setsize={results.length}
			aria-activedescendant={activeId}
			nativeID={`menuBox-${baseId}`}

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
