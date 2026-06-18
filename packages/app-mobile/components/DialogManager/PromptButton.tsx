import * as React from 'react';
import { useMemo } from 'react';
import { StyleSheet, TextStyle, View } from 'react-native';
import { TouchableRipple, Text, useTheme } from 'react-native-paper';
import { PromptButtonSpec } from './types';
import { ThemeStyle, themeStyle } from '../global-style';
import Icon from '../Icon';

interface Props {
	themeId: number;
	buttonSpec: PromptButtonSpec;
	isMenu: boolean;
}

const useStyles = (theme: ThemeStyle, spec: PromptButtonSpec, isMenu: boolean) => {
	const paperTheme = useTheme();

	const { onColor, color } = (() => {
		const style = spec.style ?? 'default';
		if (style === 'destructive') {
			return {
				onColor: paperTheme.colors.onErrorContainer,
				color: paperTheme.colors.errorContainer,
			};
		} else if (style === 'cancel') {
			return {
				onColor: paperTheme.colors.onSecondary,
				color: paperTheme.colors.secondary,
			};
		} else if (isMenu) {
			return {
				onColor: theme.color4,
				color: theme.backgroundColor4,
			};
		} else {
			return {
				onColor: paperTheme.colors.onPrimary,
				color: paperTheme.colors.primary,
			};
		}
	})();

	return useMemo(() => {
		const buttonText: TextStyle = {
			color: onColor,
			fontWeight: '600',
			textAlign: 'center',
		};

		return StyleSheet.create({
			buttonContainer: {
				backgroundColor: color,

				// This applies the borderRadius to the TouchableRipple's parent, which
				// seems necessary on Android.
				borderRadius: theme.borderRadius,
				overflow: 'hidden',
			},
			button: {
				borderRadius: theme.borderRadius,
				paddingHorizontal: 20,
				paddingVertical: 15,
				minWidth: 72,
			},
			buttonContent: {
				display: 'flex',
				flexDirection: 'row',
				justifyContent: 'center',
				alignItems: 'baseline',
			},
			buttonText,
			icon: {
				...buttonText,
				marginRight: 8,
			},
		});
	}, [theme, color, onColor]);
};

const PromptButton: React.FC<Props> = props => {
	const theme = themeStyle(props.themeId);
	const styles = useStyles(theme, props.buttonSpec, props.isMenu);

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
		<View style={styles.buttonContainer}>
			<TouchableRipple
				onPress={onPress}
				style={styles.button}
				rippleColor={theme.backgroundColorHover4}
				accessibilityRole={isCheckbox ? 'checkbox' : 'button'}
				accessibilityState={isCheckbox ? { checked } : null}
				aria-checked={isCheckbox ? checked : undefined}
			>
				<View style={styles.buttonContent}>
					{icon}
					<Text style={styles.buttonText}>{text}</Text>
				</View>
			</TouchableRipple>
		</View>
	);
};

export default PromptButton;
