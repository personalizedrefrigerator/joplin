import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, TextStyle, View, Text, ScrollView, useWindowDimensions, Platform } from 'react-native';
import { themeStyle } from '../global-style';
import { Menu, MenuOption as MenuOptionComponent, MenuOptions, MenuTrigger } from 'react-native-popup-menu';
import AccessibleView from '../accessibility/AccessibleView';
import debounce from '../../utils/debounce';
import FocusControl from '../accessibility/FocusControl/FocusControl';
import { ModalState } from '../accessibility/FocusControl/types';

interface MenuOptionDivider {
	isDivider: true;
}

interface MenuOptionButton {
	key?: string;
	isDivider?: false|undefined;
	disabled?: boolean;
	onPress: ()=> void;
	title: string;
}

export type MenuOptionType = MenuOptionDivider|MenuOptionButton;

interface Props {
	themeId: number;
	options: MenuOptionType[];
	children: React.ReactNode;
}

const useStyles = (themeId: number) => {
	const { height: windowHeight } = useWindowDimensions();

	return useMemo(() => {
		const theme = themeStyle(themeId);

		const contextMenuItemTextBase: TextStyle = {
			flex: 1,
			textAlignVertical: 'center',
			paddingLeft: theme.marginLeft,
			paddingRight: theme.marginRight,
			paddingTop: theme.itemMarginTop,
			paddingBottom: theme.itemMarginBottom,
			color: theme.color,
			backgroundColor: theme.backgroundColor,
			fontSize: theme.fontSize,
		};

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
			},
			contextMenuItemText: {
				...contextMenuItemTextBase,
			},
			contextMenuItemTextDisabled: {
				...contextMenuItemTextBase,
				opacity: 0.5,
			},
			menuContentScroller: {
				maxHeight: windowHeight - 50,
			},
			contextMenuButton: {
				padding: 0,
			},
		});
	}, [themeId, windowHeight]);
};

const MenuComponent: React.FC<Props> = props => {
	const styles = useStyles(props.themeId);

	const menuOptionComponents: React.ReactNode[] = [];

	// When undefined/null: Don't auto-focus anything.
	const [refocusCounter, setRefocusCounter] = useState<number|undefined>(undefined);

	let keyCounter = 0;
	let isFirst = true;
	for (const option of props.options) {
		if (option.isDivider === true) {
			menuOptionComponents.push(
				<View key={`menuOption_divider_${keyCounter++}`} style={styles.divider} />,
			);
		} else {
			// Don't auto-focus on iOS -- as of RN 0.74, this causes focus to get stuck. However,
			// the auto-focus seems to be necessary on web (and possibly Android) to avoid first focusing
			// the dismiss button and other items not in the menu:
			const canAutoFocus = isFirst && Platform.OS !== 'ios';
			const key = `menuOption_${option.key ?? keyCounter++}`;
			menuOptionComponents.push(
				<MenuOptionComponent value={option.onPress} key={key} style={styles.contextMenuItem} disabled={!!option.disabled}>
					<AccessibleView refocusCounter={canAutoFocus ? refocusCounter : undefined} testID={key}>
						<Text
							style={option.disabled ? styles.contextMenuItemTextDisabled : styles.contextMenuItemText}
							disabled={option.disabled}
						>{option.title}</Text>
					</AccessibleView>
				</MenuOptionComponent>,
			);

			isFirst = false;
		}
	}

	const [open, setOpen] = useState(false);

	const onMenuItemSelect = useCallback((value: unknown) => {
		if (typeof value === 'function') {
			value();
		}
		setRefocusCounter(undefined);
		setOpen(false);
	}, []);

	// debounce: If the menu is focused during its transition animation, it briefly
	// appears to be in the wrong place. As such, add a brief delay before focusing.
	const onMenuOpened = useMemo(() => debounce(() => {
		setRefocusCounter(counter => (counter ?? 0) + 1);
		setOpen(true);
	}, 200), []);

	// Resetting the refocus counter to undefined causes the menu to not be focused immediately
	// after opening.
	const onMenuClosed = useCallback(() => {
		setRefocusCounter(undefined);
		setOpen(false);
	}, []);

	return (
		<Menu
			onSelect={onMenuItemSelect}
			onClose={onMenuClosed}
			onOpen={onMenuOpened}
			style={styles.contextMenu}
		>
			<MenuTrigger style={styles.contextMenuButton} testID='screen-header-menu-trigger'>
				{props.children}
			</MenuTrigger>
			<MenuOptions>
				<FocusControl.ModalWrapper state={open ? ModalState.Open : ModalState.Closed}>
					<ScrollView
						style={styles.menuContentScroller}
						testID={`menu-content-${open ? 'open' : 'closed'}`}
					>{menuOptionComponents}</ScrollView>
				</FocusControl.ModalWrapper>
			</MenuOptions>
		</Menu>
	);
};

export default MenuComponent;
