import * as React from 'react';
import { ToolbarButtonInfo } from '@joplin/lib/services/commands/ToolbarButtonUtils';
import IconButton from '../IconButton';
import { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { themeStyle } from '../global-style';

interface Props {
	themeId: number;
	buttonInfo: ToolbarButtonInfo;
	selected?: boolean;
}

const useStyles = (themeId: number, selected: boolean, enabled: boolean) => {
	return useMemo(() => {
		const theme = themeStyle(themeId);
		return StyleSheet.create({
			icon: {
				color: theme.color,
				fontSize: 22,
			},
			button: {
				backgroundColor: selected ? theme.backgroundColorHover3 : theme.backgroundColor,
				width: 48,
				height: 48,
				justifyContent: 'center',
				alignItems: 'center',
				opacity: enabled ? 1 : theme.disabledOpacity,
			},
		});
	}, [themeId, selected, enabled]);
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
