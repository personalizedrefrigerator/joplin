import * as React from 'react';
import { useContext, useEffect, useId } from 'react';
import { FocusControlContext } from './FocusControlProvider';

interface Props {
	children: React.ReactNode;
	visible: boolean;
}

// A wrapper component that notifies the focus handler that a modal-like component
// is visible. Modals that capture focus should wrap their content in this component.
const ModalContent: React.FC<Props> = props => {
	const focusControl = useContext(FocusControlContext);
	const id = useId();
	useEffect(() => {
		if (!focusControl) {
			throw new Error('ModalContent components must have a FocusControlProvider as an ancestor. Is FocusControlProvider part of the provider stack?');
		}
		focusControl.setDialogOpen(id, props.visible);
	}, [id, props.visible, focusControl]);

	useEffect(() => {
		return () => {
			focusControl?.setDialogOpen(id, false);
		};
	}, [id, focusControl]);

	return <>
		{props.children}
	</>;
};

export default ModalContent;
