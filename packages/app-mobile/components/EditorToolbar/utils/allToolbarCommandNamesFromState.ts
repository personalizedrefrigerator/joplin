import { AppState } from '../../../utils/types';
import { utils as pluginUtils } from '@joplin/lib/services/plugins/reducer';
import { EditorCommandType } from '@joplin/editor/types';

const builtInCommandNames = [
	'attachFile',
	'-',
	EditorCommandType.ToggleHeading1,
	EditorCommandType.ToggleHeading2,
	EditorCommandType.ToggleHeading3,
	EditorCommandType.ToggleHeading4,
	EditorCommandType.ToggleHeading5,
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
	'hideKeyboard',
];


const allToolbarCommandNamesFromState = (state: AppState) => {
	const pluginCommandNames = pluginUtils.commandNamesFromViews(state.pluginService.plugins, 'editorToolbar');

	let allCommandNames = builtInCommandNames;
	if (pluginCommandNames.length > 0) {
		allCommandNames = allCommandNames.concat(['-'], pluginCommandNames);
	}

	// If the user disables math markup, the "toggle math" button won't be useful.
	// Disabling the math markup button maintains compatibility with the previous
	// toolbar.
	const mathEnabled = state.settings['markdown.plugin.katex'];
	if (!mathEnabled) {
		allCommandNames = allCommandNames.filter(
			name => name !== EditorCommandType.ToggleMath,
		);
	}

	return allCommandNames;
};

export default allToolbarCommandNamesFromState;
