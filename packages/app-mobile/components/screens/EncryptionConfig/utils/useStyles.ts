import { useMemo } from 'react';
import { themeStyle } from '../../../global-style';
import { StyleSheet } from 'react-native';

const useStyles = (themeId: number) => {
	return useMemo(() => {
		const theme = themeStyle(themeId);
		return StyleSheet.create({
			rootStyle: theme.rootStyle,
			titleText: {
				flex: 1,
				fontWeight: 'bold',
				flexDirection: 'column',
				fontSize: theme.fontSize,
				paddingTop: 5,
				paddingBottom: 5,
				marginTop: theme.marginTop,
				marginBottom: 5,
				color: theme.color,
			},
			normalText: {
				flex: 1,
				fontSize: theme.fontSize,
				color: theme.color,
			},
			normalTextInput: {
				margin: 10,
				color: theme.color,
				borderWidth: 1,
				borderColor: theme.dividerColor,
			},
			container: {
				flex: 1,
				padding: theme.margin,
			},
			disabledContainer: {
				paddingLeft: theme.margin,
				paddingRight: theme.margin,
			},
			inputStyle: {
				flex: 1,
				marginRight: 10,
				color: theme.color,
				borderBottomWidth: 1,
				borderBottomColor: theme.dividerColor,
			},
			statusIcon: {
				fontSize: theme.fontSize,
				marginRight: 10,
				color: theme.color,
			},
		});
	}, [themeId]);
};

export default useStyles;
