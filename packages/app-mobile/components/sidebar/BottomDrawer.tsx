import * as React from 'react';
import Modal from '../Modal';
import SideMenu, { SideMenuPosition } from './SideMenu';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, ScrollView, StyleSheet, View } from 'react-native';
import { ThemeStyle, themeStyle } from '../global-style';
import { connect } from 'react-redux';
import { AppState } from '../../utils/types';
import useSafeAreaPadding from '../../utils/hooks/useSafeAreaPadding';
import { _ } from '@joplin/lib/locale';

interface Props {
	themeId: number;
	children: React.ReactNode;
	show: boolean;
	onDismiss: ()=> void;
}

const useStyles = (theme: ThemeStyle) => {
	const safeAreaPadding = useSafeAreaPadding();
	return useMemo(() => {
		return StyleSheet.create({
			scrollingContainer: {
				flex: 1,
				backgroundColor: theme.backgroundColor,
				borderRadius: 16,
				borderBottomRightRadius: 0,
				borderBottomLeftRadius: 0,
				maxWidth: 400,
			},
			menuStyle: {
				alignSelf: 'center',
				left: 'auto',
				right: 0,
				paddingRight: safeAreaPadding.paddingRight + 6,
				paddingLeft: safeAreaPadding.paddingLeft + 6,
				paddingBottom: 0,
			},
			contentContainer: {
				padding: 20,
				paddingBottom: 14,
				gap: 8,
				flexDirection: 'row',
				flexWrap: 'wrap',
			},
			modalBackground: {
				paddingTop: 0,
				paddingLeft: 0,
				paddingRight: 0,
				paddingBottom: 0,
			},
		});
	}, [theme, safeAreaPadding]);
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

	const onModalDismiss = useCallback(() => {
		setIsOpen(false);
	}, []);

	const [openMenuOffset, setOpenMenuOffset] = useState(400);
	const onMenuLayout = useCallback((event: LayoutChangeEvent) => {
		const height = event.nativeEvent.layout.height;
		setOpenMenuOffset(height);
	}, []);

	const theme = themeStyle(props.themeId);
	const styles = useStyles(theme);
	const menu = <ScrollView style={styles.scrollingContainer}>
		<View onLayout={onMenuLayout} style={styles.contentContainer}>
			{props.children}
		</View>
	</ScrollView>;

	return <Modal
		visible={props.show}
		modalBackgroundStyle={styles.modalBackground}
		transparent={true}
		animationType='fade'
		onDismiss={onModalDismiss}
		onRequestClose={onModalDismiss}
	>
		<SideMenu
			label={_('New note menu')}
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
