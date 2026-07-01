import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, Text, useWindowDimensions } from 'react-native';
import { themeStyle } from '../global-style';
import BottomDrawer from '../BottomDrawer';
import { TouchableRipple } from 'react-native-paper';
import Icon from '../Icon';

interface MenuOptionDivider {
	isDivider: true;
}

interface MenuOptionButton {
	key?: string;
	isDivider?: false|undefined;
	disabled?: boolean;
	onPress: ()=> void;
	icon?: string;
	title: string;
}

export type MenuOptionType = MenuOptionDivider|MenuOptionButton;

interface Props {
	themeId: number;
	options: MenuOptionType[];
	children: React.ReactNode;
}

const useStyles = (themeId: number) => {
	const windowWidth = useWindowDimensions().width;
	return useMemo(() => {
		const theme = themeStyle(themeId);

		return StyleSheet.create({
			divider: {
				borderBottomWidth: 1,
				borderColor: theme.dividerColor,
				backgroundColor: '#0000ff',
			},
			contextMenu: {
				paddingHorizontal: 0,
				paddingTop: theme.margin,
			},
			contextMenuItem: {
				alignItems: 'flex-start',
				padding: theme.margin,
				paddingLeft: theme.marginLeft,
				paddingRight: theme.marginRight,
				minWidth: Math.min(350, windowWidth),
			},
			contextMenuItemText: { color: theme.color },
			contextMenuItemTextDisabled: {
				opacity: 0.5,
				color: theme.color,
			},
			contextMenuButton: {
				padding: 0,
			},
			icon: {
				color: theme.color,
				backgroundColor: theme.backgroundColor,
				fontSize: theme.fontSizeLarge,
			},
		});
	}, [themeId, windowWidth]);
};

const MenuComponent: React.FC<Props> = props => {
	const styles = useStyles(props.themeId);
	const theme = themeStyle(props.themeId);

	const menuOptionComponents: React.ReactNode[] = [];

	const [open, setOpen] = useState(false);

	let keyCounter = 0;
	for (const option of props.options) {
		if (option.isDivider === true) {
			menuOptionComponents.push(
				<View key={`menuOption_divider_${keyCounter++}`} style={styles.divider} />,
			);
		} else {
			const key = `menuOption_${option.key ?? keyCounter++}`;
			menuOptionComponents.push(
				<TouchableRipple
					borderless={true}
					role='button'
					style={styles.contextMenuItem}
					onPress={() => {
						option.onPress();
						setOpen(false);
					}}
					key={key}
					disabled={!!option.disabled}
				>
					<View style={{ flexDirection: 'row', gap: theme.marginSmall }}>
						{option.icon && <Icon name={option.icon} style={{ color: theme.color, fontSize: theme.fontSize }} accessibilityLabel={null} />}
						<Text
							style={option.disabled ? styles.contextMenuItemTextDisabled : styles.contextMenuItemText}
							disabled={option.disabled}
						>{option.title}</Text>
					</View>
				</TouchableRipple>,
			);
		}
	}

	// Resetting the refocus counter to undefined causes the menu to not be focused immediately
	// after opening.
	const onMenuClosed = useCallback(() => {
		setOpen(false);
	}, []);

	return <>
		<TouchableRipple
			borderless={true}
			onPress={() => setOpen(true)}
			rippleColor={theme.backgroundColorTransparent2}
			role='button'
		>
			{props.children}
		</TouchableRipple>
		<BottomDrawer
			visible={open}
			onDismiss={onMenuClosed}
			style={styles.contextMenu}
		>
			<View style={{ flexDirection: 'column', width: '100%' }}>
				{menuOptionComponents}
			</View>
		</BottomDrawer>
	</>;
};

export default MenuComponent;
