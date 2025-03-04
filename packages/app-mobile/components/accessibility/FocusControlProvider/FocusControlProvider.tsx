import * as React from 'react';
import { createContext, useCallback, useMemo, useState } from 'react';

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

	const setDialogOpen = useCallback((dialogId: string, open: boolean) => {
		setOpenDialogs(openDialogs => {
			openDialogs = openDialogs.filter(id => id !== dialogId);
			if (open) {
				openDialogs.push(dialogId);
			}
			return openDialogs;
		});
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
