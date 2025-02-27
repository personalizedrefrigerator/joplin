import * as React from 'react';
import { useState, useCallback, useMemo, useEffect, useContext, useRef } from 'react';
import { FAB } from 'react-native-paper';
import { _ } from '@joplin/lib/locale';
import { Dispatch } from 'redux';
import { AccessibilityActionEvent, AccessibilityActionInfo, View } from 'react-native';
import { connect } from 'react-redux';
import { BottomDrawerContext } from '../sidebar/BottomDrawerProvider';
import focusView from '../../utils/focusView';
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
	accessibilityActions?: readonly AccessibilityActionInfo[];
	onAccessibilityAction?: (event: AccessibilityActionEvent)=> void;
	accessibilityHint?: string;
	menuLabel?: string;

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

	const drawerControl = useContext(BottomDrawerContext);
	const mainButtonRef = useRef<View>();
	useEffect(() => {
		if (open) {
			const drawer = drawerControl.showDrawer({
				renderContent: () => {
					return props.menuContent;
				},
				onHide: () => {
					focusView('FloatingActionButton', mainButtonRef.current);
					setOpen(false);
				},
				label: props.menuLabel,
			});

			return () => {
				drawer.remove();
			};
		}

		return () => {};
	}, [open, drawerControl, props.menuContent, props.menuLabel]);

	const closedIcon = useIcon(props.mainButton?.icon ?? 'add');
	const openIcon = useIcon('close');

	const label = props.mainButton?.label ?? _('Add new');

	const menuButton = <FAB
		ref={mainButtonRef}
		icon={open ? openIcon : closedIcon}
		accessibilityLabel={label}
		onPress={props.mainButton?.onPress ?? onMenuToggled}
		style={{
			alignSelf: 'flex-end',
		}}
		accessibilityActions={props.accessibilityActions}
		onAccessibilityAction={props.onAccessibilityAction}
	/>;

	return (
		<View
			style={{
				position: 'absolute',
				bottom: 10,
				right: 10,
			}}
		>
			{menuButton}
		</View>
	);
};

export default connect()(FloatingActionButton);
