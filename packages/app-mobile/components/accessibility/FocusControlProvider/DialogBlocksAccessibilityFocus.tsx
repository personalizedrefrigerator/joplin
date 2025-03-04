import * as React from 'react';
import AccessibleView from '../AccessibleView';
import { FocusControlContext } from './FocusControlProvider';
import { useContext } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

interface Props {
	children: React.ReactNode;
	style?: StyleProp<ViewStyle>;
}

// A region that should not be accessibility focusable while a dialog
// is open.
const DialogBlocksAccessibilityFocus: React.FC<Props> = props => {
	const { isDialogOpen } = useContext(FocusControlContext);
	return <AccessibleView inert={isDialogOpen} style={props.style}>
		{props.children}
	</AccessibleView>;
};

export default DialogBlocksAccessibilityFocus;
