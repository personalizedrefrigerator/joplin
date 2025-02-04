import * as React from 'react';
import Modal from '../Modal';
import SideMenu, { SideMenuPosition } from './SideMenu';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, ScrollView, StyleSheet, View } from 'react-native';
import { ThemeStyle, themeStyle } from '../global-style';
import { connect } from 'react-redux';
import { AppState } from '../../utils/types';

interface Props {
	themeId: number;
	children: React.ReactNode;
	show: boolean;
	onDismiss: ()=> void;
}

const useStyles = (theme: ThemeStyle, verticalPadding: number) => {
	return useMemo(() => {
		return StyleSheet.create({
			scrollingContainer: {
				flex: 1,
				backgroundColor: theme.backgroundColor,
				borderRadius: 10,
				maxWidth: 400,
			},
			menuStyle: {
				alignSelf: 'center',
				left: 'auto',
				right: 'auto',
			},
			contentContainer: {
				padding: verticalPadding,
				gap: 8,
				flexDirection: 'row',
			},
		});
	}, [theme, verticalPadding]);
};

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
	const verticalPadding = 20;
	const onMenuLayout = useCallback((event: LayoutChangeEvent) => {
		const height = event.nativeEvent.layout.height;
		setOpenMenuOffset(height + verticalPadding * 2);
	}, [verticalPadding]);

	const theme = themeStyle(props.themeId);
	const styles = useStyles(theme, verticalPadding);
	const menu = <ScrollView style={styles.scrollingContainer}>
		<View onLayout={onMenuLayout} style={styles.contentContainer}>
			{props.children}
		</View>
	</ScrollView>;

	return <Modal visible={props.show} transparent={true} animationType='fade'>
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
			overlayColor={theme.color}
			menuStyle={styles.menuStyle}
		><View/></SideMenu>
	</Modal>;
};

export default connect((state: AppState) => {
	return {
		themeId: state.settings.theme,
	};
})(BottomDrawer);
