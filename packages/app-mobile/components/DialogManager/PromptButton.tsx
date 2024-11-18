import * as React from 'react';
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { TouchableRipple, Text } from 'react-native-paper';
import { PromptButtonSpec } from './types';
import { ThemeStyle, themeStyle } from '../global-style';
import Icon from '../Icon';

interface Props {
	themeId: number;
	buttonSpec: PromptButtonSpec;
}

const useStyles = (theme: ThemeStyle) => {
	return useMemo(() => {
		return StyleSheet.create({
			button: {
				borderRadius: theme.borderRadius,
				padding: 10,
			},
			buttonText: {
				color: theme.color4,
				textAlign: 'center',
			},
			icon: {
				marginEnd: 8,
			},
		});
	}, [theme]);
};

const PromptButton: React.FC<Props> = props => {
	const theme = themeStyle(props.themeId);
	const styles = useStyles(theme);

	const { checked, text, iconChecked, onPress } = props.buttonSpec;

	const isCheckbox = (checked ?? null) !== null;
	const icon = checked ? (
		<>
			<Icon
				accessibilityLabel={null}
				style={styles.icon}
				name={iconChecked ?? 'fas fa-check'}
			/>
		</>
	) : null;

	return (
		<TouchableRipple
			onPress={onPress}
			style={styles.button}
			rippleColor={theme.backgroundColorHover4}
			accessibilityRole={isCheckbox ? 'checkbox' : 'button'}
			accessibilityState={isCheckbox ? { checked } : null}
			aria-checked={isCheckbox ? checked : undefined}
		>
			<Text style={styles.buttonText}>{icon}{text}</Text>
		</TouchableRipple>
	);
};

export default PromptButton;
