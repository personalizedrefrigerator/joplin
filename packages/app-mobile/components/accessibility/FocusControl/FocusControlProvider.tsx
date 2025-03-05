import * as React from 'react';
import { createContext, useCallback, useMemo, useRef, useState } from 'react';

export interface FocusControl {
	setDialogOpen(dialogId: string, open: boolean): void;
	isDialogOpen: boolean;
}

export const FocusControlContext = createContext<FocusControl|null>(null);

interface Props {
	children: React.ReactNode;
}

const FocusControlProvider: React.FC<Props> = props => {
	const [openDialogs, setOpenDialogs] = useState<string[]>([]);
	const openDialogsRef = useRef(openDialogs);
	openDialogsRef.current = openDialogs;

	const setDialogOpen = useCallback((dialogId: string, open: boolean) => {
		const lastOpen = openDialogsRef.current.includes(dialogId);

		if (lastOpen !== open) {
			setOpenDialogs(openDialogs => {
				openDialogs = openDialogs.filter(id => id !== dialogId);
				if (open) {
					openDialogs = [...openDialogs, dialogId];
				}

				return openDialogs;
			});
		}
	}, []);

	const hasOpenDialog = openDialogs.length > 0;
	const focusControl = useMemo((): FocusControl => {
		return {
			isDialogOpen: hasOpenDialog,
			setDialogOpen,
		};
	}, [hasOpenDialog, setDialogOpen]);

	return <FocusControlContext.Provider value={focusControl}>
		{props.children}
	</FocusControlContext.Provider>;
};

export default FocusControlProvider;
