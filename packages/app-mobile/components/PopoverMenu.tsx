import * as React from 'react';
import { useCallback, useMemo } from 'react';
import { StyleSheet, ScrollView, ViewStyle, useWindowDimensions, View, Text, TextStyle } from 'react-native';
import { Menu, MenuOption, MenuOptions, MenuTrigger } from 'react-native-popup-menu';
import Icon from './Icon';
import { themeStyle } from './global-style';

type OnPressCallback = ()=> void;
interface MenuButtonType {
	onPress: OnPressCallback;
	isDivider?: boolean;
	title: string;
	disabled?: boolean;
}
// Dividers don't need to specify other properties.
type MenuDividerType = Partial<MenuButtonType> & {
	isDivider: true;
};
export type MenuOptionType = MenuButtonType|MenuDividerType;

interface Props {
	themeId: number;
	options: MenuOptionType[];
	triggerLabel: string;
	triggerStyle: ViewStyle;
}

const useStyles = (themeId: number, baseTriggerStyle: ViewStyle) => {
	const { height: windowHeight } = useWindowDimensions();
	return useMemo(() => {
		const theme = themeStyle(themeId);
		const baseContextMenuTextStyle: TextStyle = {
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
			contextMenu: {
				backgroundColor: theme.backgroundColor2,
			},
			contextMenuItem: {
				backgroundColor: theme.backgroundColor,
			},
			contextMenuItemText: baseContextMenuTextStyle,
			contextMenuItemTextDisabled: {
				...baseContextMenuTextStyle,
				opacity: 0.5,
			},
			triggerStyle: {
				color: theme.color2,
				...baseTriggerStyle,
			},
			scrollWrapper: {
				maxHeight: windowHeight - 50,
			},
			divider: {
				borderBottomWidth: 1,
				borderColor: theme.dividerColor,
				backgroundColor: '#0000ff',
			},
		});
	}, [themeId, windowHeight, baseTriggerStyle]);
};

const PopoverMenu: React.FC<Props> = props => {
	const styles = useStyles(props.themeId, props.triggerStyle);

	const menuOptionComponents = [];

	let key = 0;
	for (const option of props.options) {
		if (option.isDivider) {
			menuOptionComponents.push(<View key={`menuOption_${key++}`} style={styles.divider} />);
		} else {
			menuOptionComponents.push(
				<MenuOption
					value={option.onPress}
					key={`menuOption_${key++}`}
					style={styles.contextMenuItem}
					disabled={!!option.disabled}
				>
					<Text
						style={option.disabled ? styles.contextMenuItemTextDisabled : styles.contextMenuItemText}
					>
						{option.title}
					</Text>
				</MenuOption>,
			);
		}
	}

	const onSelect = useCallback((selectedValue: any) => {
		if (typeof selectedValue === 'function') {
			selectedValue();
		}
	}, []);

	return (
		<Menu onSelect={onSelect} style={styles.contextMenu}>
			<MenuTrigger>
				<Icon
					name="ionicon ellipsis-vertical"
					style={props.triggerStyle}
					accessibilityLabel={props.triggerLabel}
					accessibilityRole='button'
				/>
			</MenuTrigger>
			<MenuOptions>
				<ScrollView style={styles.scrollWrapper}>
					{menuOptionComponents}
				</ScrollView>
			</MenuOptions>
		</Menu>
	);
};

export default PopoverMenu;
