import * as React from 'react';
import { RefObject, useContext, useEffect, useId, useRef } from 'react';
import { DialogContext } from './index';
import { CustomDialogHandle } from './types';

interface Props {
	visible: boolean;
	onDismiss: ()=> void;
	children: React.ReactNode;
}

const useClearDialogOnUnload = (dialogRef: RefObject<CustomDialogHandle|null>) => {
	useEffect(() => () => {
		dialogRef.current?.dismiss();
		dialogRef.current = null;
	}, [dialogRef]);
};

const CustomDialog: React.FC<Props> = props => {
	const dialogs = useContext(DialogContext);

	const dialogRef = useRef<CustomDialogHandle|null>(null);
	useClearDialogOnUnload(dialogRef);

	useEffect(() => {
		if (!props.visible && dialogRef.current) {
			dialogRef.current.dismiss();
			dialogRef.current = null;
		}
	}, [props.visible]);

	const id = useId();
	if (props.visible && dialogs) {
		dialogRef.current = dialogs.showCustom(id, props.children, props.onDismiss);
	}

	return <></>;
};

export default CustomDialog;
