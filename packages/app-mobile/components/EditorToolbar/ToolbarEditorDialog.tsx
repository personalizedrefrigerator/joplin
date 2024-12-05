import * as React from 'react';
import { useMemo } from 'react';
import createRootStyle from '../../utils/createRootStyle';
import { FlatList, View, StyleSheet } from 'react-native';
import { Divider, Text } from 'react-native-paper';
import { _ } from '@joplin/lib/locale';
import { themeStyle } from '../global-style';
import { connect } from 'react-redux';
import ToolbarButtonUtils, { ToolbarItem } from '@joplin/lib/services/commands/ToolbarButtonUtils';
import Icon from '../Icon';
import Checkbox from '../Checkbox';
import { AppState } from '../../utils/types';
import stateToWhenClauseContext from '@joplin/lib/services/commands/stateToWhenClauseContext';
import CommandService from '@joplin/lib/services/CommandService';
import defaultCommandNamesFromState from './utils/defaultCommandNamesFromState';
import Setting from '@joplin/lib/models/Setting';
import DismissibleDialog, { DialogSize } from '../DismissibleDialog';

const toolbarButtonUtils = new ToolbarButtonUtils(CommandService.instance());

interface Props {
	themeId: number;
	defaultToolbarButtonInfos: ToolbarItem[];
	selectedCommandNames: string[];
	defaultCommandNames: string[];

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
				fontSize: theme.fontSize,
			},
			labelText: {
				fontSize: theme.fontSize,
			},
			listContainer: {
				marginTop: theme.marginTop,
				flex: 1,
			},
			listItem: {
				flexDirection: 'row',
				gap: theme.margin,
				padding: 4,
				paddingTop: theme.itemMarginTop,
				paddingBottom: theme.itemMarginBottom,
			},
			checkbox: {
				color: theme.color,
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

const setCommandIncluded = (commandName: string, allCommandNames: string[], include: boolean) => {
	let newSelectedCommands;
	if (include) {
		newSelectedCommands = [];
		for (const name of allCommandNames) {
			if (name === commandName || allCommandNames.includes(name)) {
				newSelectedCommands.push(name);
			}
		}
	} else {
		const lastSelectedCommands = Setting.value('editor.toolbarButtons');
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
			<View style={styles.listItem}>
				<Checkbox
					checked={checked}
					onChange={() => setCommandIncluded(item.name, props.defaultCommandNames, !checked)}
					accessibilityLabel={title}
					style={styles.checkbox}
				/>
				<Icon name={item.iconName} style={styles.icon} accessibilityLabel={null}/>
				<Text style={styles.labelText}>
					{title}
				</Text>
			</View>
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

	const defaultCommandNames = defaultCommandNamesFromState(state);
	const selectedCommandNames = state.settings['editor.toolbarButtons'].length ? (
		state.settings['editor.toolbarButtons']
	) : defaultCommandNamesFromState(state);

	return {
		themeId: state.settings.theme,
		selectedCommandNames,
		defaultCommandNames,
		defaultToolbarButtonInfos: toolbarButtonUtils.commandsToToolbarButtons(defaultCommandNames, whenClauseContext),
	};
})(ToolbarEditorScreen);
