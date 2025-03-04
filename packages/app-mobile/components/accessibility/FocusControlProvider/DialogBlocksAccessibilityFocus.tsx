import * as React from 'react';
import AccessibleView from '../AccessibleView';
import { FocusControlContext } from './FocusControlProvider';
import { useContext } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import AutoFocusProvider from './AutoFocusProvider';

interface Props {
	children: React.ReactNode;
	style?: StyleProp<ViewStyle>;
}

// A region that should not be accessibility focusable while a dialog
// is open.
const DialogBlocksAccessibilityFocus: React.FC<Props> = props => {
	const { isDialogOpen } = useContext(FocusControlContext);
	const blockFocus = isDialogOpen;

	return <AccessibleView inert={blockFocus} style={props.style}>
		<AutoFocusProvider allowAutoFocus={!blockFocus}>
			{props.children}
		</AutoFocusProvider>
	</AccessibleView>;
};

export default DialogBlocksAccessibilityFocus;
