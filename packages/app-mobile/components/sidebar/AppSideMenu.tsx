import * as React from 'react';
import { AppState } from '../../utils/types';
import { connect } from 'react-redux';
import { themeStyle } from '../global-style';
import SideMenu, { OnChangeCallback, SideMenuPosition } from './SideMenu';
import { _ } from '@joplin/lib/locale';

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

	return <SideMenu
		label={_('Side menu')}
		overlayColor={theme.colorFaded}
		menuStyle={{ backgroundColor: theme.backgroundColor }}
		isOpen={props.open}
		onChange={props.onChange}

		disableGestures={props.disableGestures}

		menuPosition={props.menuPosition}
		menu={props.menu}
		openMenuOffset={props.openMenuOffset}
	>{props.children}</SideMenu>;
};

export default connect((state: AppState) => {
	return {
		themeId: state.settings.theme,
		open: state.showSideMenu,
	};
})(AppSideMenu);
