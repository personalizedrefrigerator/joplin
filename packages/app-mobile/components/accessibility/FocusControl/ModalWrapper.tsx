import * as React from 'react';
import { useContext, useEffect, useId } from 'react';
import { FocusControlContext } from './FocusControlProvider';

interface Props {
	children: React.ReactNode;
	// Should be true while the modal controls focus
	visible: boolean;
}

// A wrapper component that notifies the focus handler that a modal-like component
// is visible. Modals that capture focus should wrap their content in this component.
const ModalWrapper: React.FC<Props> = props => {
	const { setDialogOpen } = useContext(FocusControlContext);
	const id = useId();
	useEffect(() => {
		if (!setDialogOpen) {
			throw new Error('ModalContent components must have a FocusControlProvider as an ancestor. Is FocusControlProvider part of the provider stack?');
		}
		setDialogOpen(id, props.visible);
	}, [id, props.visible, setDialogOpen]);

	useEffect(() => {
		return () => {
			setDialogOpen?.(id, false);
		};
	}, [id, setDialogOpen]);

	return <>
		{props.children}
	</>;
};

export default ModalWrapper;
