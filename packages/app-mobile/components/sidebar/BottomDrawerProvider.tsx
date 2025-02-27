import * as React from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import BottomDrawer from './BottomDrawer';

type DrawerSpec = {
	key: string;
	renderContent: ()=> React.ReactNode;
	onHide: ()=> void;
	label: string;
};

type DrawerHandle = {
	remove: ()=> void;
};

interface DrawerControl {
	showDrawer(spec: DrawerSpec): DrawerHandle;
	hideDrawer(key: string): void;
}

export const BottomDrawerContext = React.createContext<DrawerControl>(null);

interface Props {
	children: React.ReactNode;
}

const BottomDrawerProvider: React.FC<Props> = props => {
	const [drawers, setDrawers] = useState<DrawerSpec[]>([]);
	const drawersRef = useRef(drawers);
	drawersRef.current = drawers;

	const addOrUpdateDrawer = useCallback((spec: DrawerSpec) => {
		setDrawers(drawers => {
			const result = [];
			let added = false;
			for (const drawer of drawers) {
				if (drawer.key === spec.key) {
					result.push(spec);
					added = true;
				} else {
					result.push(drawer);
				}
			}
			if (!added) {
				result.push(spec);
			}
			return result;
		});
	}, []);

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
				addOrUpdateDrawer(spec);

				return {
					remove: () => {
						spec.onHide();
					},
				};
			},
			hideDrawer(key) {
				for (const drawer of drawersRef.current) {
					if (drawer.key === key) {
						drawer.onHide();
					}
				}
			},
		};
	}, [addOrUpdateDrawer]);

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
