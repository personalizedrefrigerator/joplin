import * as React from 'react';
import { AppState } from '../../utils/types';
import { connect } from 'react-redux';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ToolbarButtonInfo, ToolbarItem } from '@joplin/lib/services/commands/ToolbarButtonUtils';
import toolbarButtonsFromState from './utils/toolbarButtonsFromState';
import ButtonGroup from './ButtonGroup';
import { useCallback, useMemo, useRef, useState } from 'react';
import { themeStyle } from '../global-style';
import ToggleSpaceButton from '../ToggleSpaceButton';
import SettingButton from './SettingButton';
import ToolbarEditorDialog from './ToolbarEditorDialog';
import { EditorState } from './types';

interface Props {
	themeId: number;
	toolbarButtonInfos: ToolbarItem[];
	editorState: EditorState;
}

const useStyles = (themeId: number) => {
	return useMemo(() => {
		const theme = themeStyle(themeId);
		return StyleSheet.create({
			content: {
				flexGrow: 0,
				backgroundColor: theme.backgroundColor3,
			},
			contentContainer: {
				paddingVertical: 4,
				flexDirection: 'row',
			},
		});
	}, [themeId]);
};

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
			editorState={props.editorState}
			themeId={props.themeId}
		/>;
	};

	const [settingsVisible, setSettingsVisible] = useState(false);
	const scrollViewRef = useRef<ScrollView|null>(null);
	const onDismissSettingsDialog = useCallback(() => {
		setSettingsVisible(false);

		// On Android, if the ScrollView isn't manually scrolled to the end,
		// all items can be invisible in some cases. This causes issues with
		// TalkBack on Android.
		// In particular, if 1) the toolbar initially has many items on a device
		// with a small screen, and 2) the user removes most items, then most/all
		// items are scrolled offscreen. Calling .scrollToEnd corrects this:
		scrollViewRef.current?.scrollToEnd();
	}, []);

	return <>
		<ToggleSpaceButton themeId={props.themeId}>
			<ScrollView
				ref={scrollViewRef}
				horizontal={true}
				style={styles.content}
			>
				<View style={styles.contentContainer}>
					{buttonGroups.map(renderGroup)}
					<SettingButton
						setSettingsVisible={setSettingsVisible}
						themeId={props.themeId}
					/>
				</View>
			</ScrollView>
		</ToggleSpaceButton>
		<ToolbarEditorDialog visible={settingsVisible} onDismiss={onDismissSettingsDialog} />
	</>;
};

export default connect((state: AppState) => {
	return {
		themeId: state.settings.theme,
		toolbarButtonInfos: toolbarButtonsFromState(state),
	};
})(EditorToolbar);
