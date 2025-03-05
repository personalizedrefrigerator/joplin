import * as React from 'react';
import { createContext, useCallback, useMemo, useState } from 'react';
import { ModalState } from './types';

export interface FocusControl {
	setModalState(dialogId: string, state: ModalState): void;

	isModalOpen: boolean;
	isModalClosing: boolean;
}

export const FocusControlContext = createContext<FocusControl|null>(null);

interface Props {
	children: React.ReactNode;
}

const FocusControlProvider: React.FC<Props> = props => {
	type ModalStates = Record<string, ModalState>;
	const [modalStates, setModalStates] = useState<ModalStates>({});

	const setModalOpen = useCallback((dialogId: string, state: ModalState) => {
		setModalStates(modalStates => {
			modalStates = { ...modalStates };
			if (state === ModalState.Closed) {
				delete modalStates[dialogId];
			} else {
				modalStates[dialogId] = state;
			}
			return modalStates;
		});
	}, []);

	const modalStateValues = Object.values(modalStates);
	const hasOpenDialog = modalStateValues.includes(ModalState.Open);
	const hasClosingDialog = modalStateValues.includes(ModalState.Closing);

	const focusControl = useMemo((): FocusControl => {
		return {
			isModalOpen: hasOpenDialog,
			isModalClosing: hasClosingDialog,
			setModalState: setModalOpen,
		};
	}, [hasOpenDialog, hasClosingDialog, setModalOpen]);

	return <FocusControlContext.Provider value={focusControl}>
		{props.children}
	</FocusControlContext.Provider>;
};

export default FocusControlProvider;
