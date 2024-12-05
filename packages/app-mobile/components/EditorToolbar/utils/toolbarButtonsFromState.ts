import { AppState } from '../../../utils/types';
import ToolbarButtonUtils from '@joplin/lib/services/commands/ToolbarButtonUtils';
import CommandService from '@joplin/lib/services/CommandService';
import stateToWhenClauseContext from '@joplin/lib/services/commands/stateToWhenClauseContext';
import defaultCommandNamesFromState from './defaultCommandNamesFromState';

const toolbarButtonUtils = new ToolbarButtonUtils(CommandService.instance());

const toolbarButtonsFromState = (state: AppState) => {
	const whenClauseContext = stateToWhenClauseContext(state);

	const commandNames = state.settings['editor.toolbarButtons']?.length ? (
		state.settings['editor.toolbarButtons']
	) : defaultCommandNamesFromState(state);

	return toolbarButtonUtils.commandsToToolbarButtons(commandNames, whenClauseContext);
};

export default toolbarButtonsFromState;
