import * as React from 'react';
import { useCallback, useMemo } from 'react';
import createRootStyle from '../../utils/createRootStyle';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Divider, Text, TouchableRipple } from 'react-native-paper';
import { _ } from '@joplin/lib/locale';
import { themeStyle } from '../global-style';
import { connect } from 'react-redux';
import ToolbarButtonUtils, { ToolbarButtonInfo, ToolbarItem } from '@joplin/lib/services/commands/ToolbarButtonUtils';
import Icon from '../Icon';
import { AppState } from '../../utils/types';
import CommandService from '@joplin/lib/services/CommandService';
import allCommandNamesFromState from './utils/allCommandNamesFromState';
import Setting from '@joplin/lib/models/Setting';
import DismissibleDialog, { DialogSize } from '../DismissibleDialog';
import selectedCommandNamesFromState from './utils/selectedCommandNamesFromState';
import stateToWhenClauseContext from '../../services/commands/stateToWhenClauseContext';

const toolbarButtonUtils = new ToolbarButtonUtils(CommandService.instance());

interface EditorDialogProps {
	themeId: number;
	defaultToolbarButtonInfos: ToolbarItem[];
	selectedCommandNames: string[];
	allCommandNames: string[];

	visible: boolean;
	onDismiss: ()=> void;
}

const useStyle = (themeId: number) => {
	return useMemo(() => {
		const theme = themeStyle(themeId);

		return StyleSheet.create({
			...createRootStyle(themeId),
			icon: {
				color: theme.color,
				fontSize: theme.fontSizeLarge,
			},
			labelText: {
				fontSize: theme.fontSize,
			},
			listContainer: {
				marginTop: theme.marginTop,
				flex: 1,
			},
			listItemButton: {

			},
			listItem: {
				flexDirection: 'row',
				alignItems: 'center',
				justifyContent: 'flex-start',
				gap: theme.margin,
				padding: 4,
				paddingTop: theme.itemMarginTop,
				paddingBottom: theme.itemMarginBottom,
			},
		});
	}, [themeId]);
};
type Styles = ReturnType<typeof useStyle>;

const setCommandIncluded = (
	commandName: string,
	lastSelectedCommands: string[],
	allCommandNames: string[],
	include: boolean,
) => {
	let newSelectedCommands;
	if (include) {
		newSelectedCommands = [];
		for (const name of allCommandNames) {
			const isDivider = name === '-';
			if (isDivider || name === commandName || lastSelectedCommands.includes(name)) {
				newSelectedCommands.push(name);
			}
		}
	} else {
		newSelectedCommands = lastSelectedCommands.filter(name => name !== commandName);
	}
	Setting.setValue('editor.toolbarButtons', newSelectedCommands);
};

interface ItemToggleProps {
	item: ToolbarButtonInfo;
	selectedCommandNames: string[];
	allCommandNames: string[];
	styles: Styles;
}
const ToolbarItemToggle: React.FC<ItemToggleProps> = ({
	item, selectedCommandNames, styles, allCommandNames,
}) => {
	const title = item.title || item.tooltip;
	const checked = selectedCommandNames.includes(item.name);

	const onToggle = useCallback(() => {
		setCommandIncluded(item.name, selectedCommandNames, allCommandNames, !checked);
	}, [item, selectedCommandNames, allCommandNames, checked]);

	return (
		<TouchableRipple
			style={styles.listItemButton}
			accessibilityRole='checkbox'
			accessibilityState={{ checked }}
			aria-checked={checked}
			onPress={onToggle}
		>
			<View style={styles.listItem}>
				<Icon name={checked ? 'ionicon checkbox-outline' : 'ionicon square-outline'} style={styles.icon} accessibilityLabel={null}/>
				<Icon name={item.iconName} style={styles.icon} accessibilityLabel={null}/>
				<Text style={styles.labelText}>
					{title}
				</Text>
			</View>
		</TouchableRipple>
	);
};

const ToolbarEditorScreen: React.FC<EditorDialogProps> = props => {
	const styles = useStyle(props.themeId);

	const renderItem = (item: ToolbarItem, index: number) => {
		if (item.type === 'separator') {
			return <Divider key={`separator-${index}`} />;
		}

		return <ToolbarItemToggle
			key={`command-${item.name}`}
			item={item}
			styles={styles}
			allCommandNames={props.allCommandNames}
			selectedCommandNames={props.selectedCommandNames}
		/>;
	};

	return (
		<DismissibleDialog
			size={DialogSize.Small}
			themeId={props.themeId}
			visible={props.visible}
			onDismiss={props.onDismiss}
		>
			<View>
				<Text variant='headlineMedium'>{_('Manage toolbar options')}</Text>
				<Text variant='labelMedium'>{_('Check elements to display in the toolbar')}</Text>
			</View>
			<ScrollView style={styles.listContainer}>
				{props.defaultToolbarButtonInfos.map((item, index) => renderItem(item, index))}
			</ScrollView>
		</DismissibleDialog>
	);
};

export default connect((state: AppState) => {
	const whenClauseContext = stateToWhenClauseContext(state);

	const allCommandNames = allCommandNamesFromState(state);
	const selectedCommandNames = selectedCommandNamesFromState(state);

	return {
		themeId: state.settings.theme,
		selectedCommandNames,
		allCommandNames,
		defaultToolbarButtonInfos: toolbarButtonUtils.commandsToToolbarButtons(allCommandNames, whenClauseContext),
	};
})(ToolbarEditorScreen);
