import * as React from 'react';
import SelectionFormatting from '@joplin/editor/SelectionFormatting';
import { ToolbarButtonInfo } from '@joplin/lib/services/commands/ToolbarButtonUtils';
import IconButton from '../IconButton';
import useIsSelected from './utils/useIsSelected';
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { themeStyle } from '../global-style';

interface Props {
	themeId: number;
	buttonInfo: ToolbarButtonInfo;
	selectionState: SelectionFormatting|null;
}

const ToolbarButton: React.FC<Props> = ({ themeId, buttonInfo, selectionState }) => {
	const commandName = buttonInfo.name;
	const selected = useIsSelected({ selectionState, commandName });
	const styles = useStyles(themeId, selected);
	const isToggleButton = selected !== undefined;

	return <IconButton
		iconName={buttonInfo.iconName}
		description={buttonInfo.title || buttonInfo.tooltip}
		onPress={buttonInfo.onClick}
		iconStyle={styles.icon}
		containerStyle={styles.button}
		accessibilityState={{ selected }}
		accessibilityRole={isToggleButton ? 'togglebutton' : 'button'}
		role={'button'}
		aria-pressed={selected}
		preventKeyboardDismiss={true}
		themeId={themeId}
	/>;
};

const useStyles = (themeId: number, selected: boolean) => {
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
			},
		});
	}, [themeId, selected]);
};

export default ToolbarButton;
