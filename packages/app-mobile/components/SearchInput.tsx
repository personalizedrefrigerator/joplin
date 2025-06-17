import * as React from 'react';
import TextInput from './TextInput';
import { View, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { IconButton } from 'react-native-paper';
import { _ } from '@joplin/lib/locale';
import { useCallback, useMemo } from 'react';
import { themeStyle } from './global-style';


interface SearchInputProps extends TextInputProps {
	value: string;
	onChangeText: (text: string)=> void;
	themeId: number;
	containerStyle: ViewStyle;
}

const useStyles = (themeId: number) => {
	return useMemo(() => {
		const theme = themeStyle(themeId);
		return StyleSheet.create({
			root: {
				flexDirection: 'row',
				justifyContent: 'center',
			},
			inputStyle: {
				fontSize: theme.fontSize,
				flexGrow: 1,
				borderWidth: 0,
				borderBlockColor: 'transparent',
				paddingLeft: 0,
				paddingRight: 0,
				paddingTop: 0,
				paddingBottom: 0,
			},
		});
	}, [themeId]);
};

const SearchInput: React.FC<SearchInputProps> = ({ themeId, value, containerStyle, style, onChangeText, ...rest }) => {
	const styles = useStyles(themeId);

	const onClear = useCallback(() => {
		onChangeText('');
	}, [onChangeText]);

	return <View style={[styles.root, containerStyle]}>
		<IconButton
			aria-hidden={true}
			icon='magnify'
			role='img'
		/>
		<TextInput
			style={[styles.inputStyle, style]}
			themeId={themeId}
			value={value}
			onChangeText={onChangeText}
			underlineColorAndroid='transparent'
			{...rest}
		/>
		<IconButton
			icon='close'
			onPress={onClear}
			accessibilityLabel={_('Clear search')}
			disabled={value.length === 0}
		/>
	</View>;
};

export default SearchInput;
