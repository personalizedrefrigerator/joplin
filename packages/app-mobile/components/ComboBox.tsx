import * as React from 'react';
import { FlatList, NativeSyntheticEvent, StyleSheet, View } from 'react-native';
import { TouchableRipple, Text, Searchbar } from 'react-native-paper';
import { connect } from 'react-redux';
import { AppState } from '../utils/types';
import { themeStyle } from './global-style';
import Icon from './Icon';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { _ } from '@joplin/lib/locale';

interface Option {
	label: string;
	onPress?: ()=> void;
}

interface Props {
	themeId: number;
	items: Option[];
	onItemSelected: (item: Option)=> void;
	onAddItem?: (content: string)=> void;
	placeholder: string;
}


const optionKeyExtractor = (option: Option) => option.label;

interface SearchResultsOptions {
	search: string;
	options: Option[];
	onAddItem: (content: string)=> void;
}

const useSearchResults = ({ search, options, onAddItem }: SearchResultsOptions) => {
	const results = useMemo(() => {
		return options
			.filter(option => option.label.startsWith(search))
			.sort((a, b) => {
				if (a.label === b.label) return 0;
				// Full matches should go first
				if (a.label === search) return -1;
				if (b.label === search) return 1;
				// Sort longer items first
				return b.label.length - a.label.length;
			});
	}, [search, options]);

	return useMemo(() => {
		if (!onAddItem || results[0]?.label === search) return results;

		return [
			...results,
			{
				label: _('Add new'),
				onPress: () => {
					onAddItem(search);
				},
			},
		];
	}, [search, results, onAddItem]);
};

const useSelectedIndex = (searchResults: Option[]) => {
	const [selectedIndex, setSelectedIndex] = useState(0);

	useEffect(() => {
		setSelectedIndex(0);
	}, [searchResults]);

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
				paddingLeft: 4,
				paddingRight: 12,
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
	selected: boolean;
	onPress: ()=> void;
	styles: Styles;
	id: string;
	index: number;
	'aria-posinset': number;
	'aria-setsize': number;
}

const SearchResult: React.FC<SearchResultProps> = ({
	text, onPress, styles, selected, id, ...rest
}) => {
	return <TouchableRipple
		onPress={onPress}
		role='menuitem'
		aria-selected={selected}
		nativeID={id}
		{...rest}
	>
		<View style={[styles.menuItemContent, selected && styles.menuItemContentSelected]}>
			<Icon
				style={styles.tagIcon}
				name='fas fa-tag'
				// Description is provided by adjacent text
				accessibilityLabel={null}
			/>
			<Text style={styles.tagLabel}>{text}</Text>
		</View>
	</TouchableRipple>;
};


const ComboBox: React.FC<Props> = ({
	themeId, items, onItemSelected: propsOnItemSelected, placeholder, onAddItem,
}) => {
	const styles = useStyles(themeId);
	const [search, setSearch] = useState('');

	const results = useSearchResults({
		search,
		options: items,
		onAddItem,
	});
	const { selectedIndex, onNextResult, onPreviousResult } = useSelectedIndex(results);
	const listRef = useRef<FlatList|null>(null);

	useEffect(() => {
		listRef.current?.scrollToIndex({ index: selectedIndex, animated: false, viewPosition: 0.5 });
	}, [selectedIndex]);

	const propsOnItemSelectedRef = useRef(propsOnItemSelected);
	propsOnItemSelectedRef.current = propsOnItemSelected;

	const onItemSelected = useCallback((item: Option) => {
		if (item.onPress) {
			item.onPress();
		} else {
			propsOnItemSelectedRef.current(item);
			setSearch(item.label);
		}
	}, []);

	const baseId = useId();

	type RenderEvent = { item: Option; index: number };
	const renderItem = useCallback(({ item, index }: RenderEvent) => {
		return <SearchResult
			text={item.label}
			onPress={() => {
				onItemSelected(item);
			}}
			styles={styles}
			selected={selectedIndex === index}
			id={`${baseId}-${index}`}
			index={index}
			aria-setsize={results.length}
			aria-posinset={index + 1}
		/>;
	}, [results.length, baseId, selectedIndex, onItemSelected, styles]);

	// For now, onKeyPress only works on web.
	// See https://github.com/react-native-community/discussions-and-proposals/issues/249
	type KeyPressEvent = { key: string };
	const onKeyPress = useCallback(({ nativeEvent }: NativeSyntheticEvent<KeyPressEvent>) => {
		if (nativeEvent.key === 'ArrowDown') {
			onNextResult();
		} else if (nativeEvent.key === 'ArrowUp') {
			onPreviousResult();
		} else if (nativeEvent.key === 'Enter') {
			const item = results[selectedIndex];
			if (item) {
				onItemSelected(item);
			}
		}
	}, [selectedIndex, results, onItemSelected, onNextResult, onPreviousResult]);

	return <View style={styles.root}>
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
			role='menu'
			aria-setsize={results.length}
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
