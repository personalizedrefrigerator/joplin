import * as React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { TouchableRipple, Text } from 'react-native-paper';
import { connect } from 'react-redux';
import { AppState } from '../utils/types';
import { themeStyle } from './global-style';
import Icon from './Icon';
import TextInput from './TextInput';
import { useMemo, useState } from 'react';

interface Props {
	themeId: number;
	items: string[];
	onItemSelected: (item: string)=> void;
	allowNewItems: boolean;
	placeholder: string;
}

const ComboBox: React.FC<Props> = ({
	themeId, items, onItemSelected, placeholder,
}) => {
	const styles = useStyles(themeId);
	const [search, setSearch] = useState('');
	const results = useSearchResults(search, items);

	type RenderEvent = { item: string };
	const renderTag = ({ item }: RenderEvent) => {
		return <SearchResult
			text={item}
			onPress={() => onItemSelected(item)}
			styles={styles}
		/>;
	};

	return <View style={styles.root}>
		<TextInput
			style={styles.searchInput}
			themeId={themeId}
			value={search}
			onChangeText={setSearch}
			placeholder={placeholder}
		/>
		<FlatList
			data={results}
			role='menu'
			style={styles.searchResults}
			keyExtractor={tagKeyExtractor}
			renderItem={renderTag}
		/>
	</View>;
};

const tagKeyExtractor = (tag: string) => tag;

const useSearchResults = (search: string, options: string[]) => {
	return useMemo(() => {
		return options.filter(option => option.startsWith(search));
	}, [search, options]);
};

const useStyles = (themeId: number) => {
	return React.useMemo(() => {
		const theme = themeStyle(themeId);
		return StyleSheet.create({
			root: {
				height: 100,
				flexDirection: 'column',
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
			},
			menuItemContent: {
				flexDirection: 'row',
			},
		});
	}, [themeId]);
};

type Styles = ReturnType<typeof useStyles>;

interface SearchResultProps {
	text: string;
	onPress: ()=> void;
	styles: Styles;
}

const SearchResult: React.FC<SearchResultProps> = ({
	text, onPress, styles,
}) => {
	return <TouchableRipple
		onPress={onPress}
		role='menuitem'
	>
		<View style={styles.menuItemContent}>
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

export default connect((state: AppState) => ({
	themeId: state.settings.theme,
}))(ComboBox);
