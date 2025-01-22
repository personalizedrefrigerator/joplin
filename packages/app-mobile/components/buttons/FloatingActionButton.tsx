import * as React from 'react';
import { useState, useCallback, useMemo } from 'react';
import { FAB, Portal } from 'react-native-paper';
import { _ } from '@joplin/lib/locale';
import { Dispatch } from 'redux';
import { View } from 'react-native';
const Icon = require('react-native-vector-icons/Ionicons').default;

type OnButtonPress = ()=> void;
interface ButtonSpec {
	icon: string;
	label: string;
	color?: string;
	onPress?: OnButtonPress;
}

interface ActionButtonProps {
	buttons?: ButtonSpec[];

	// If not given, an "add" button will be used.
	mainButton?: ButtonSpec;
	dispatch: Dispatch;
}

const defaultOnPress = () => {};

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
		setOpen(open => !open);
	}, [setOpen, props.dispatch]);

	const actions = useMemo(() => (props.buttons ?? []).map(button => {
		return {
			...button,
			icon: getIconRenderFunction(button.icon),
			onPress: button.onPress ?? defaultOnPress,
		};
	}), [props.buttons]);

	const closedIcon = useIcon(props.mainButton?.icon ?? 'add');
	const openIcon = useIcon('close');

	const label = props.mainButton?.label ?? _('Add new');

	const menuButton = <FAB
		icon={open ? openIcon : closedIcon}
		accessibilityLabel={label}
		onPress={props.mainButton?.onPress ?? onMenuToggled}
		aria-expanded={open}
		accessibilityState={{ expanded: open }}
		style={{
			alignSelf: 'flex-end',
		}}
	/>;

	const actionButtons = actions.map((action, idx) => {
		return <FAB
			key={`option-${idx}`}
			label={action.label}
			icon={action.icon}
			onPress={action.onPress}
			size='small'
		/>;
	}).reverse();

	return (
		<Portal>
			<View
				role='navigation'
				aria-label={_('Actions')}
				style={{
					position: 'absolute',
					bottom: 10,
					right: 10,
					// Reverse so that focus order goes from the open/close button,
					// then to the options.
					flexDirection: 'column-reverse',
					gap: 10,
				}}
			>
				{menuButton}
				{open ? actionButtons : null}
			</View>
		</Portal>
	);
};

export default FloatingActionButton;
