import { AppState } from '../../../utils/types';
import { utils as pluginUtils } from '@joplin/lib/services/plugins/reducer';
import { EditorCommandType } from '@joplin/editor/types';

const defaultCommandNames = [
	'attachFile',
	'-',
	EditorCommandType.ToggleHeading2,
	EditorCommandType.ToggleBolded,
	EditorCommandType.ToggleItalicized,
	'-',
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


const defaultCommandNamesFromState = (state: AppState) => {
	const pluginCommandNames = pluginUtils.commandNamesFromViews(state.pluginService.plugins, 'editorToolbar');

	if (pluginCommandNames.length > 0) {
		return defaultCommandNames.concat(['-'], pluginCommandNames);
	}

	return defaultCommandNames;
};

export default defaultCommandNamesFromState;
