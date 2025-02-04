import * as React from 'react';
import Modal from '../Modal';
import SideMenu, { SideMenuPosition } from './SideMenu';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, ScrollView, View } from 'react-native';

interface Props {
	children: React.ReactNode;
	show: boolean;
	onDismiss: ()=> void;
}

const BottomDrawer: React.FC<Props> = props => {
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		if (props.show) {
			setIsOpen(true);
		} else {
			setIsOpen(false);
		}
	}, [props.show]);

	const lastOpen = useRef(isOpen);
	useEffect(() => {
		if (lastOpen.current && !isOpen) {
			props.onDismiss();
		}
		lastOpen.current = isOpen;
	}, [isOpen, props.onDismiss]);

	const [openMenuOffset, setOpenMenuOffset] = useState(400);
	const onMenuLayout = useCallback((event: LayoutChangeEvent) => {
		const height = event.nativeEvent.layout.height;
		setOpenMenuOffset(height);
	}, []);

	const menu = <ScrollView style={{ height: openMenuOffset, flex: 1 }}>
		<View onLayout={onMenuLayout} style={{ padding: 10 }}>
			{props.children}
		</View>
	</ScrollView>;

	return <Modal visible={props.show} transparent={true}>
		<SideMenu
			menuPosition={SideMenuPosition.Bottom}
			menu={menu}
			isOpen={isOpen}
			onChange={(visible) => {
				if (!visible) {
					setIsOpen(false);
				}
			}}

			disableGestures={false}
			openMenuOffset={openMenuOffset}
			overlayColor='blue'
			menuStyle={{
				maxWidth: 400,
				marginLeft: 'auto',
				marginRight: 'auto',
				backgroundColor: 'white',
				padding: 8,
			}}
		><View/></SideMenu>
	</Modal>;
};

export default BottomDrawer;
