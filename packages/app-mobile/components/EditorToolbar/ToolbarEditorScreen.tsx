import * as React from 'react';
import { useMemo } from 'react';
import createRootStyle from '../../utils/createRootStyle';
import { FlatList, View, StyleSheet } from 'react-native';
import { Divider, Text } from 'react-native-paper';
import ScreenHeader from '../ScreenHeader';
import { _ } from '@joplin/lib/locale';
import { themeStyle } from '../global-style';
import { connect } from 'react-redux';
import ToolbarButtonUtils, { ToolbarItem } from '@joplin/lib/services/commands/ToolbarButtonUtils';
import Icon from '../Icon';
import Checkbox from '../Checkbox';
import { AppState } from '../../utils/types';
import { Dispatch } from 'redux';
import stateToWhenClauseContext from '@joplin/lib/services/commands/stateToWhenClauseContext';
import CommandService from '@joplin/lib/services/CommandService';
import defaultCommandNamesFromState from './utils/defaultCommandNamesFromState';
import Setting from '@joplin/lib/models/Setting';

const toolbarButtonUtils = new ToolbarButtonUtils(CommandService.instance());

interface Props {
	themeId: number;
	defaultToolbarButtonInfos: ToolbarItem[];
	selectedCommandNames: string[];
	defaultCommandNames: string[];
	dispatch: Dispatch;
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
				flex: 1,
			},
			listItem: {
				flexDirection: 'row',
				gap: 4,
				padding: 4,
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
					onChange={() => {
						let newSelectedCommands = [...props.selectedCommandNames];
						if (checked) {
							newSelectedCommands = newSelectedCommands.filter(name => name !== item.name);
						} else {
							newSelectedCommands = [];
							for (const commandName of props.defaultCommandNames) {
								if (commandName === item.name || props.selectedCommandNames.includes(commandName)) {
									newSelectedCommands.push(commandName);
								}
							}
						}
						Setting.setValue('editor.toolbarButtons', newSelectedCommands);
					}}
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
		<View style={styles.root}>
			<ScreenHeader
				title={_('Toolbar')}
				showSaveButton={false}
				showSideMenuButton={false}
				showSearchButton={false}
			/>
			<View>
				<Text variant='titleSmall'>{_('Manage toolbar options')}</Text>
				<Text variant='bodyMedium'>{_('Check elements to display in the toolbar')}</Text>
			</View>
			<View style={styles.listContainer}>
				<FlatList
					data={props.defaultToolbarButtonInfos}
					renderItem={renderItem}
					keyExtractor={keyExtractor}
					extraData={props.selectedCommandNames}
				/>
			</View>
		</View>
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
