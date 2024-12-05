import * as React from 'react';
import { useMemo } from 'react';
import createRootStyle from '../../utils/createRootStyle';
import { FlatList, View, StyleSheet } from 'react-native';
import { Divider, Text, TouchableRipple } from 'react-native-paper';
import { _ } from '@joplin/lib/locale';
import { themeStyle } from '../global-style';
import { connect } from 'react-redux';
import ToolbarButtonUtils, { ToolbarItem } from '@joplin/lib/services/commands/ToolbarButtonUtils';
import Icon from '../Icon';
import { AppState } from '../../utils/types';
import stateToWhenClauseContext from '@joplin/lib/services/commands/stateToWhenClauseContext';
import CommandService from '@joplin/lib/services/CommandService';
import allCommandNamesFromState from './utils/allCommandNamesFromState';
import Setting from '@joplin/lib/models/Setting';
import DismissibleDialog, { DialogSize } from '../DismissibleDialog';
import selectedCommandNamesFromState from './utils/selectedCommandNamesFromState';

const toolbarButtonUtils = new ToolbarButtonUtils(CommandService.instance());

interface Props {
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

const keyExtractor = (item: ToolbarItem, index: number) => {
	if (item.type === 'separator') {
		return `separator-${index}`;
	} else {
		return `command-${item.name}`;
	}
};

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

const ToolbarEditorScreen: React.FC<Props> = props => {
	const styles = useStyle(props.themeId);

	type RenderItemEvent = { item: ToolbarItem };
	const renderItem = ({ item }: RenderItemEvent) => {
		if (item.type === 'separator') {
			return <Divider/>;
		}

		const title = item.title || item.tooltip;
		const checked = props.selectedCommandNames.includes(item.name);

		return (
			<TouchableRipple
				style={styles.listItemButton}
				accessibilityRole='checkbox'
				accessibilityState={{ checked }}
				aria-checked={checked}
				onPress={() => setCommandIncluded(item.name, props.selectedCommandNames, props.allCommandNames, !checked)}
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
			<View style={styles.listContainer}>
				<FlatList
					data={props.defaultToolbarButtonInfos}
					renderItem={renderItem}
					keyExtractor={keyExtractor}
					extraData={props.selectedCommandNames}
				/>
			</View>
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
