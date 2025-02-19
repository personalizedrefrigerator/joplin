import * as React from 'react';
import { useState, useCallback, useMemo } from 'react';
import { FAB, Portal } from 'react-native-paper';
import { _ } from '@joplin/lib/locale';
import { Dispatch } from 'redux';
import { View } from 'react-native';
import BottomDrawer from '../sidebar/BottomDrawer';
import { connect } from 'react-redux';
const Icon = require('react-native-vector-icons/Ionicons').default;

type OnButtonPress = ()=> void;
interface ButtonSpec {
	icon: string;
	label: string;
	color?: string;
	onPress?: OnButtonPress;
}

interface ActionButtonProps {
	menuContent?: React.ReactNode;
	onMenuToggled?: (visible: boolean)=> void;

	// If not given, an "add" button will be used.
	mainButton?: ButtonSpec;
	dispatch: Dispatch;
}

// Returns a render function compatible with React Native Paper.
const getIconRenderFunction = (iconName: string) => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	return (props: any) => <Icon name={iconName} {...props} />;
};

const useIcon = (iconName: string) => {
	return useMemo(() => {
		return getIconRenderFunction(iconName);
	}, [iconName]);
};

const FloatingActionButton = (props: ActionButtonProps) => {
	const [open, setOpen] = useState(false);
	const onMenuToggled = useCallback(() => {
		props.dispatch({
			type: 'SIDE_MENU_CLOSE',
		});
		const newOpen = !open;
		setOpen(newOpen);
		props.onMenuToggled?.(newOpen);
	}, [setOpen, open, props.onMenuToggled, props.dispatch]);

	const closedIcon = useIcon(props.mainButton?.icon ?? 'add');
	const openIcon = useIcon('close');

	const label = props.mainButton?.label ?? _('Add new');

	const hasMenu = !!props.menuContent;
	const menuButton = <FAB
		icon={open ? openIcon : closedIcon}
		accessibilityLabel={label}
		onPress={props.mainButton?.onPress ?? onMenuToggled}
		aria-expanded={hasMenu ? open : undefined}
		accessibilityState={hasMenu ? { expanded: open } : undefined}
		style={{
			alignSelf: 'flex-end',
		}}
	/>;

	return (
		<Portal>
			<View
				style={{
					position: 'absolute',
					bottom: 10,
					right: 10,
				}}
			>
				{menuButton}
			</View>
			<BottomDrawer onDismiss={() => setOpen(false)} show={open}>
				{props.menuContent}
			</BottomDrawer>
		</Portal>
	);
};

export default connect()(FloatingActionButton);
