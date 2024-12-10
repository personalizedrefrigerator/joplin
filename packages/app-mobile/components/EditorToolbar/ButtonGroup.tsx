import * as React from 'react';
import { ToolbarButtonInfo } from '@joplin/lib/services/commands/ToolbarButtonUtils';
import { View, ViewStyle } from 'react-native';
import ToolbarButton from './ToolbarButton';
import isSelected from './utils/isSelected';
import { EditorState } from './types';

interface Props {
	themeId: number;
	buttonInfos: ToolbarButtonInfo[];
	editorState: EditorState;
}

const containerStyle: ViewStyle = {
	flexDirection: 'row',
};

const ButtonGroup: React.FC<Props> = props => {
	const renderButton = (info: ToolbarButtonInfo) => {
		return <ToolbarButton
			key={`command-${info.name}`}
			buttonInfo={info}
			themeId={props.themeId}
			selected={isSelected(info.name, props.editorState)}
		/>;
	};

	return <View style={containerStyle}>
		{props.buttonInfos.map(renderButton)}
	</View>;
};

export default ButtonGroup;
