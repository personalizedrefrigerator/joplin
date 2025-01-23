import * as React from 'react';
import ToolbarButton from '../ToolbarButton/ToolbarButton';
import { ToolbarButtonInfo } from '@joplin/lib/services/commands/ToolbarButtonUtils';
import CommandService from '@joplin/lib/services/CommandService';
import { themeStyle } from '@joplin/lib/theme';
import { AppState } from '../../app.reducer';
import { connect } from 'react-redux';
import { TagEntity } from '@joplin/lib/services/database/types';
import TagList from '../TagList';
import { _ } from '@joplin/lib/locale';

interface Props {
	themeId: number;
	tabMovesFocus: boolean;
	noteId: string;
	setTagsToolbarButtonInfo: ToolbarButtonInfo;
	selectedNoteTags: TagEntity[];
}

const StatusBar: React.FC<Props> = props => {
	function renderTagButton() {
		return <ToolbarButton
			themeId={props.themeId}
			toolbarButtonInfo={props.setTagsToolbarButtonInfo}
		/>;
	}

	function renderTagBar() {
		const theme = themeStyle(props.themeId);
		const noteIds = [props.noteId];
		const instructions = <span onClick={() => { void CommandService.instance().execute('setTags', noteIds); }} style={{ ...theme.clickableTextStyle, whiteSpace: 'nowrap' }}>{_('Click to add tags...')}</span>;
		const tagList = props.selectedNoteTags.length ? <TagList items={props.selectedNoteTags} /> : null;

		return (
			<div style={{ paddingLeft: 8, display: 'flex', flexDirection: 'row', alignItems: 'center' }}>{tagList}{instructions}</div>
		);
	}

	const tagBar = <div className="tag-bar">
		{renderTagButton()}
		{renderTagBar()}
	</div>;

	const keyboardStatus = <div className='status' role='status'>
		{props.tabMovesFocus ? _('Tab moves focus') : null}
	</div>;

	return <div className='editor-status-bar'>
		{tagBar}
		<div className='spacer'></div>
		{keyboardStatus}
	</div>;
};

export default connect((state: AppState) => {
	return {
		themeId: state.settings.theme,
		tabMovesFocus: state.settings['editor.tabMovesFocus'],
	};
})(StatusBar);
