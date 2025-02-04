import * as React from 'react';
import { ToolbarButtonInfo } from '@joplin/lib/services/commands/ToolbarButtonUtils';
import IconButton from '../IconButton';
import { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { themeStyle } from '../global-style';
import useButtonSize from './utils/useButtonSize';

interface Props {
	themeId: number;
	buttonInfo: ToolbarButtonInfo;
	selected?: boolean;
}

const useStyles = (themeId: number, selected: boolean, enabled: boolean) => {
	const { buttonSize, iconSize } = useButtonSize();

	return useMemo(() => {
		const theme = themeStyle(themeId);
		return StyleSheet.create({
			icon: {
				color: theme.color,
				fontSize: iconSize,
			},
			button: {
				width: buttonSize,
				height: buttonSize,
				justifyContent: 'center',
				alignItems: 'center',
				backgroundColor: selected ? theme.backgroundColorHover3 : theme.backgroundColor3,
				opacity: enabled ? 1 : theme.disabledOpacity,
			},
		});
	}, [themeId, selected, enabled, buttonSize, iconSize]);
};

const ToolbarButton: React.FC<Props> = memo(({ themeId, buttonInfo, selected }) => {
	const styles = useStyles(themeId, selected, buttonInfo.enabled);
	const isToggleButton = selected !== undefined;

	return <IconButton
		iconName={buttonInfo.iconName}
		description={buttonInfo.title || buttonInfo.tooltip}
		onPress={buttonInfo.onClick}
		disabled={!buttonInfo.enabled}
		iconStyle={styles.icon}
		containerStyle={styles.button}
		accessibilityState={{ selected }}
		accessibilityRole={isToggleButton ? 'togglebutton' : 'button'}
		role={'button'}
		aria-pressed={selected}
		preventKeyboardDismiss={true}
		themeId={themeId}
	/>;
});

export default ToolbarButton;
