import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, useWindowDimensions } from 'react-native';
import { themeStyle } from '../global-style';
import useKeyboardState from '../../utils/hooks/useKeyboardState';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
	const { width: windowWidth, height: windowHeight } = useWindowDimensions();
	const safeAreaInsets = useSafeAreaInsets();
	const { dockedKeyboardHeight: keyboardHeight } = useKeyboardState();

	return useMemo(() => {
		const theme = themeStyle(themeId);

		const isLandscape = windowWidth > windowHeight;
		const extraPadding = isLandscape ? 25 : 50;

		// When a docked on-screen keyboard is showing, we want to maximise the height of the menu as much as possible, due to the limited available space.
		// However, when the on-screen keyboard is hidden or floating in either portrait or landscape orientation, it is less of an issue to have excess in the amount
		// of padding, to ensure nothing is cut off on all varieties of supported mobile platforms with different input and navigation bar settings. In particular,
		// on Android it is not possible to distinguish between a floating keyboard and a horizontal input bar which is docked, but the latter requires a larger
		// reduction in height. For this reason we use a fixed value for insetOrExtraFullscreenPadding when the keyboard height is zero. However, Android versions
		// earlier than 15 have an IME toolbar in addition to the input toolbar when using an external keyboard, so to cater for this scenario, we can use the fixed
		// value if the keyboardHeight is <= 25 (as any proper on-screen keyboard would be much taller than this). If the keyboard height is larger than this, we can assume
		// a docked keyboard is visible, so we only need cater for the insets in addition to the fixed extraPadding required for compatibility across Android versions
		const insetOrExtraFullscreenPadding = keyboardHeight <= 25 ? 70 : safeAreaInsets.top + safeAreaInsets.bottom;
		const maxMenuHeight = windowHeight - keyboardHeight - extraPadding - insetOrExtraFullscreenPadding;

		return StyleSheet.create({
			divider: {
				borderBottomWidth: 1,
				borderColor: theme.dividerColor,
				backgroundColor: '#0000ff',
			},
			contextMenu: {
				backgroundColor: theme.backgroundColor2,
			},
			contextMenuItem: {
				backgroundColor: theme.backgroundColor,
				justifyContent: 'space-between',
			},
			contextMenuItemText: { color: theme.color },
			contextMenuItemTextDisabled: {
				opacity: 0.5,
				color: theme.color,
			},
			menuContentScroller: {
				maxHeight: maxMenuHeight,
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
	}, [themeId, windowWidth, windowHeight, safeAreaInsets, keyboardHeight]);
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
					role='button'
					style={{ alignItems: 'flex-start', padding: theme.margin }}
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
			<ScrollView
				style={styles.menuContentScroller}
				testID={`menu-content-${open ? 'open' : 'closed'}`}
			>
				<View style={{ flexDirection: 'column' }}>{menuOptionComponents}</View>
			</ScrollView>
		</BottomDrawer>
	</>;
};

export default MenuComponent;
