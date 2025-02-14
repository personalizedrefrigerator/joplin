import * as React from 'react';
import { AppState } from '../../utils/types';
import { connect } from 'react-redux';
import { themeStyle } from '../global-style';
import SideMenu, { OnChangeCallback, SideMenuPosition } from './SideMenu';
import { _ } from '@joplin/lib/locale';
import AccessibleView from '../accessibility/AccessibleView';

interface Props {
	themeId: number;
	openMenuOffset: number;
	menu: React.ReactNode;
	children: React.ReactNode;

	menuPosition: SideMenuPosition;
	onChange: OnChangeCallback;
	disableGestures: boolean;

	open: boolean;
}

const AppSideMenu: React.FC<Props> = props => {
	const theme = themeStyle(props.themeId);

	const menuContent = <>
		<AccessibleView
			// Auto-focuses an empty view at the beginning of the sidemenu -- if we instead
			// focus the container view, VoiceOver fails to focus to any components within
			// the sidebar.
			refocusCounter={props.open ? 1 : undefined}
		/>
		{props.menu}
	</>;

	return <SideMenu
		label={_('Side menu')}
		overlayColor={theme.colorFaded}
		menuStyle={{ backgroundColor: theme.backgroundColor }}
		isOpen={props.open}
		onChange={props.onChange}

		disableGestures={props.disableGestures}

		menuPosition={props.menuPosition}
		menu={menuContent}
		openMenuOffset={props.openMenuOffset}
	>{props.children}</SideMenu>;
};

export default connect((state: AppState) => {
	return {
		themeId: state.settings.theme,
		open: state.showSideMenu,
	};
})(AppSideMenu);
