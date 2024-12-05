import * as React from 'react';
import ButtonGroup from './ButtonGroup';
import ToolbarButtonUtils, { ToolbarButtonInfo } from '@joplin/lib/services/commands/ToolbarButtonUtils';
import CommandService from '@joplin/lib/services/CommandService';
import { connect } from 'react-redux';
import { AppState } from '../../utils/types';
import stateToWhenClauseContext from '@joplin/lib/services/commands/stateToWhenClauseContext';

interface Props {
	themeId: number;
	buttonInfos: ToolbarButtonInfo[];
}

const toolbarButtonUtils = new ToolbarButtonUtils(CommandService.instance());

const SettingButton: React.FC<Props> = props => {
	return <ButtonGroup
		themeId={props.themeId}
		buttonInfos={props.buttonInfos}
		selectionState={null}
	/>;
};

export default connect((state: AppState) => {
	const whenClauseContext = stateToWhenClauseContext(state);

	return {
		themeId: state.settings.theme,
		buttonInfos: toolbarButtonUtils.commandsToToolbarButtons(['showToolbarSettings'], whenClauseContext) as ToolbarButtonInfo[],
	};
})(SettingButton);
