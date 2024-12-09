import * as React from 'react';
import ButtonGroup from './ButtonGroup';
import { ToolbarButtonInfo } from '@joplin/lib/services/commands/ToolbarButtonUtils';
import { _ } from '@joplin/lib/locale';
import { useMemo } from 'react';

interface Props {
	themeId: number;
	setSettingsVisible: (visible: boolean)=> void;
}

const SettingButton: React.FC<Props> = ({ themeId, setSettingsVisible }) => {
	const buttonInfos: ToolbarButtonInfo[] = useMemo(() => [{
		type: 'button',
		name: 'showToolbarSettings',
		tooltip: _('Settings'),
		iconName: 'material cogs',
		enabled: true,
		onClick: () => setSettingsVisible(true),
		title: '',
	}], [setSettingsVisible]);

	return <ButtonGroup
		themeId={themeId}
		buttonInfos={buttonInfos}
		editorState={null}
	/>;
};

export default SettingButton;

