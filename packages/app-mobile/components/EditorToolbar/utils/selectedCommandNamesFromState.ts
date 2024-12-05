import { EditorCommandType } from '@joplin/editor/types';
import { AppState } from '../../../utils/types';
import allCommandNamesFromState from './allCommandNamesFromState';

const omitFromDefault: string[] = [
	EditorCommandType.ToggleHeading1,
	EditorCommandType.ToggleHeading2,
	EditorCommandType.ToggleHeading3,
	EditorCommandType.ToggleHeading4,
	EditorCommandType.ToggleHeading5,
];

const selectedCommandNamesFromState = (state: AppState) => {
	const allCommandNames = allCommandNamesFromState(state);
	const defaultCommandNames = allCommandNames.filter(commandName => {
		return !omitFromDefault.includes(commandName);
	});

	const commandNameSetting = state.settings['editor.toolbarButtons'] ?? [];
	const selectedCommands = commandNameSetting.length > 0 ? commandNameSetting : defaultCommandNames;

	return selectedCommands.filter(command => allCommandNames.includes(command));
};

export default selectedCommandNamesFromState;
