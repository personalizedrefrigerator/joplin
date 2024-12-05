import * as React from 'react';
import { AppState } from '../../utils/types';
import { connect } from 'react-redux';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ToolbarButtonInfo, ToolbarItem } from '@joplin/lib/services/commands/ToolbarButtonUtils';
import toolbarButtonsFromState from './utils/toolbarButtonsFromState';
import SelectionFormatting from '@joplin/editor/SelectionFormatting';
import ButtonGroup from './ButtonGroup';
import { useMemo } from 'react';
import { themeStyle } from '../global-style';
import ToggleSpaceButton from '../ToggleSpaceButton';

interface Props {
	themeId: number;
	toolbarButtonInfos: ToolbarItem[];
	selectionState: SelectionFormatting;
}

const EditorToolbar: React.FC<Props> = props => {
	const styles = useStyles(props.themeId);

	const buttonGroups: ToolbarButtonInfo[][] = [];
	let currentGroup: ToolbarButtonInfo[] = [];

	const finalizeGroup = () => {
		if (currentGroup.length > 0) {
			buttonGroups.push(currentGroup);
			currentGroup = [];
		}
	};

	for (const info of props.toolbarButtonInfos) {
		if (info.type === 'separator') {
			finalizeGroup();
		} else {
			currentGroup.push(info);
		}
	}

	finalizeGroup();

	const renderGroup = (group: ToolbarButtonInfo[]) => {
		const firstItem = group[0];
		return <ButtonGroup
			key={`group-starting-with-${firstItem.name}`}
			buttonInfos={group}
			selectionState={props.selectionState}
			themeId={props.themeId}
		/>;
	};
	return <ToggleSpaceButton themeId={props.themeId}>
		<ScrollView horizontal={true} style={styles.content}>
			<View style={styles.contentContainer}>
				{buttonGroups.map(renderGroup)}
			</View>
		</ScrollView>
	</ToggleSpaceButton>;
};

const useStyles = (themeId: number) => {
	return useMemo(() => {
		const theme = themeStyle(themeId);
		return StyleSheet.create({
			content: {
				flexGrow: 0,
			},
			contentContainer: {
				paddingVertical: 4,
				flexDirection: 'row',
				backgroundColor: theme.backgroundColor3,
				borderWidth: 1,
				borderColor: theme.color3,
				borderRadius: 10,
			},
		});
	}, [themeId]);
};

export default connect((state: AppState) => {
	return {
		themeId: state.settings.theme,
		toolbarButtonInfos: toolbarButtonsFromState(state),
	};
})(EditorToolbar);
