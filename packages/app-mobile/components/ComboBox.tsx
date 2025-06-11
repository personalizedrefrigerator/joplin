import * as React from 'react';
import { FlatList, NativeSyntheticEvent, StyleSheet, View } from 'react-native';
import { TouchableRipple, Text } from 'react-native-paper';
import { connect } from 'react-redux';
import { AppState } from '../utils/types';
import { themeStyle } from './global-style';
import Icon from './Icon';
import TextInput from './TextInput';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface Props {
	themeId: number;
	items: string[];
	onItemSelected: (item: string)=> void;
	allowNewItems: boolean;
	placeholder: string;
}


const tagKeyExtractor = (tag: string) => tag;

const useSearchResults = (search: string, options: string[]) => {
	return useMemo(() => {
		return options
			.filter(option => option.startsWith(search))
			// Sort longer items first
			.sort((a, b) => b.length - a.length);
	}, [search, options]);
};

const useSelectedIndex = (searchResults: string[]) => {
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
		return StyleSheet.create({
			root: {
				height: 200,
				flexDirection: 'column',
				borderColor: theme.dividerColor,
				borderWidth: 1,
				borderRadius: 15,
			},
			searchInput: {
				color: theme.color,
				fontSize: theme.fontSize,
			},
			searchResults: {

			},
			tagIcon: {
				color: theme.color,
				fontSize: theme.fontSize,
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
}

const SearchResult: React.FC<SearchResultProps> = ({
	text, onPress, styles, selected,
}) => {
	return <TouchableRipple
		onPress={onPress}
		role='menuitem'
		aria-selected={selected}
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
	themeId, items, onItemSelected, placeholder,
}) => {
	const styles = useStyles(themeId);
	const [search, setSearch] = useState('');
	const results = useSearchResults(search, items);
	const { selectedIndex, onNextResult, onPreviousResult } = useSelectedIndex(results);

	type RenderEvent = { item: string; index: number };
	const renderTag = ({ item, index }: RenderEvent) => {
		return <SearchResult
			text={item}
			onPress={() => {
				setSearch(item);
				onItemSelected(item);
			}}
			styles={styles}
			selected={selectedIndex === index}
		/>;
	};

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
				setSearch(item);
				onItemSelected(item);
			}
		}
	}, [selectedIndex, results, onItemSelected, onNextResult, onPreviousResult]);

	return <View style={styles.root}>
		<TextInput
			style={styles.searchInput}
			themeId={themeId}
			value={search}
			onChangeText={setSearch}
			onKeyPress={onKeyPress}
			placeholder={placeholder}
		/>
		<FlatList
			data={results}
			role='menu'
			style={styles.searchResults}
			keyExtractor={tagKeyExtractor}
			extraData={selectedIndex}
			renderItem={renderTag}
		/>
	</View>;
};


export default connect((state: AppState) => ({
	themeId: state.settings.theme,
}))(ComboBox);
