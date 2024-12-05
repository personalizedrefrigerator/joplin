import * as React from 'react';
import { ToolbarButtonInfo } from '@joplin/lib/services/commands/ToolbarButtonUtils';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { themeStyle } from '../global-style';
import ToolbarButton from './ToolbarButton';
import SelectionFormatting from '@joplin/editor/SelectionFormatting';
import isSelected from './utils/isSelected';

interface Props {
	themeId: number;
	buttonInfos: ToolbarButtonInfo[];
	selectionState: SelectionFormatting;
}

const useStyles = (themeId: number) => {
	return useMemo(() => {
		const theme = themeStyle(themeId);
		return StyleSheet.create({
			container: {
				backgroundColor: theme.backgroundColor,
				borderRadius: 10,
				borderWidth: 1,
				borderColor: theme.color3,
				overflow: 'hidden',
				flexDirection: 'row',
				marginHorizontal: 4,
			},
		});
	}, [themeId]);
};

const ButtonGroup: React.FC<Props> = props => {
	const styles = useStyles(props.themeId);

	const renderButton = (info: ToolbarButtonInfo) => {
		return <ToolbarButton
			key={`command-${info.name}`}
			buttonInfo={info}
			themeId={props.themeId}
			selected={isSelected(info.name, props.selectionState)}
		/>;
	};

	return <View style={styles.container}>
		{props.buttonInfos.map(renderButton)}
	</View>;
};

export default ButtonGroup;
