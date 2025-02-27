import * as React from 'react';
import { useCallback, useMemo, useState } from 'react';
import BottomDrawer from './BottomDrawer';

type DrawerSpec = {
	renderContent: ()=> React.ReactNode;
	onHide: ()=> void;
	label: string;
};

type DrawerHandle = {
	remove: ()=> void;
};

interface DrawerControl {
	showDrawer(spec: DrawerSpec): DrawerHandle;
}

export const BottomDrawerContext = React.createContext<DrawerControl>(null);

interface Props {
	children: React.ReactNode;
}

const BottomDrawerProvider: React.FC<Props> = props => {
	const [drawers, setDrawers] = useState<DrawerSpec[]>([]);

	const drawerControl = useMemo((): DrawerControl => {
		return {
			showDrawer(spec) {
				const originalOnHide = spec.onHide;
				spec = {
					...spec,
					onHide: () => {
						setDrawers(drawers => {
							return drawers.filter(
								drawer => drawer !== spec,
							);
						});

						originalOnHide();
					},
				};

				setDrawers(drawers => [...drawers, spec]);

				return {
					remove: () => {
						spec.onHide();
					},
				};
			},
		};
	}, []);

	const onDismiss = useCallback(() => {
		drawers[drawers.length - 1]?.onHide();
	}, [drawers]);

	return <BottomDrawerContext.Provider value={drawerControl}>
		<BottomDrawer
			menu={drawers[drawers.length - 1]?.renderContent()}
			menuLabel={drawers[drawers.length - 1]?.label}
			show={drawers.length > 0}
			onDismiss={onDismiss}
		>
			{props.children}
		</BottomDrawer>
	</BottomDrawerContext.Provider>;
};

export default BottomDrawerProvider;
