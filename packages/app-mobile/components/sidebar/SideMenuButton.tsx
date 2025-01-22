import * as React from 'react';
import { useMemo } from 'react';
import { AccessibilityRole, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { themeStyle } from '../global-style';

interface Props {
	themeId: number;
	// Set to null if not clickable
	onPress: (()=> void)|null;
	text: string;
	icon: React.ReactNode;
	selected?: boolean;
	contentRole?: AccessibilityRole;
}

const useStyles = (themeId: number) => {
	return useMemo(() => {
		const theme = themeStyle(themeId);
		return StyleSheet.create({
			container: {
				flex: 0,
				flexDirection: 'row',
				flexBasis: 'auto',
				height: 36,
				alignItems: 'center',
				paddingLeft: theme.marginLeft,
				paddingRight: theme.marginRight,
			},
			icon: {
				fontSize: 22,
				color: theme.color,
				width: 26,
				textAlign: 'center',
				textAlignVertical: 'center',
			},
			text: {
				flex: 1,
				color: theme.color,
				paddingLeft: 10,
				fontSize: theme.fontSize,
			},
		});
	}, [themeId]);
};

const SideMenuButton: React.FC<Props> = props => {
	const styles = useStyles(props.themeId);
	const content = <View style={styles.container}>
		{props.icon}
		<Text
			style={styles.text}
			accessibilityRole={props.contentRole}
		>{props.text}</Text>
	</View>;

	if (!props.onPress) return content;

	return (
		<TouchableOpacity
			onPress={props.onPress}
			role='button'
			accessibilityRole='button'
			accessibilityState={props.selected ? { selected: true } : undefined}
		>
			{content}
		</TouchableOpacity>
	);
};

export default SideMenuButton;
