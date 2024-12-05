import { AppState } from '../../../utils/types';
import { utils as pluginUtils } from '@joplin/lib/services/plugins/reducer';
import ToolbarButtonUtils from '@joplin/lib/services/commands/ToolbarButtonUtils';
import CommandService from '@joplin/lib/services/CommandService';
import stateToWhenClauseContext from '@joplin/lib/services/commands/stateToWhenClauseContext';
import { EditorCommandType } from '@joplin/editor/types';

const defaultCommandNames = [
	'attachFile',
	'-',
	EditorCommandType.ToggleHeading2,
	EditorCommandType.ToggleBolded,
	EditorCommandType.ToggleItalicized,
	EditorCommandType.ToggleCode,
	EditorCommandType.ToggleMath,
	'-',
	EditorCommandType.ToggleNumberedList,
	EditorCommandType.ToggleBulletedList,
	EditorCommandType.ToggleCheckList,
	'-',
	EditorCommandType.IndentLess,
	EditorCommandType.IndentMore,
	'-',
	EditorCommandType.EditLink,
	'setTags',
	EditorCommandType.ToggleSearch,
];

const toolbarButtonUtils = new ToolbarButtonUtils(CommandService.instance());

const toolbarButtonsFromState = (state: AppState) => {
	const pluginCommandNames = pluginUtils.commandNamesFromViews(state.pluginService.plugins, 'editorToolbar');
	const whenClauseContext = stateToWhenClauseContext(state);

	const commandNames = state.settings['editor.toolbarButtons'].length ? (
		state.settings['editor.toolbarButtons'].concat(pluginCommandNames)
	) : defaultCommandNames;

	return toolbarButtonUtils.commandsToToolbarButtons(commandNames, whenClauseContext);
};

export default toolbarButtonsFromState;
