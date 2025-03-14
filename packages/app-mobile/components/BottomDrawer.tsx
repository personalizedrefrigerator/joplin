import * as React from 'react';
import { connect } from 'react-redux';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import useSafeAreaPadding from '../utils/hooks/useSafeAreaPadding';
import { themeStyle, ThemeStyle } from './global-style';
import Modal from './Modal';
import { AppState } from '../utils/types';

interface Props {
	themeId: number;
	children: React.ReactNode;
	visible: boolean;
	onDismiss: ()=> void;
}

const useStyles = (theme: ThemeStyle) => {
	const { width: windowWidth } = useWindowDimensions();
	const safeAreaPadding = useSafeAreaPadding();

	return useMemo(() => {
		const isSmallWidthScreen = windowWidth < 500;
		const menuGapLeft = safeAreaPadding.paddingLeft + 6;
		const menuGapRight = safeAreaPadding.paddingRight + 6;

		return StyleSheet.create({
			outerContainer: {
				flex: 1,
				backgroundColor: theme.backgroundColor,
				borderRadius: 16,
				borderBottomRightRadius: 0,
				borderBottomLeftRadius: 0,
				maxWidth: Math.min(400, windowWidth - menuGapRight - menuGapLeft),
			},
			menuStyle: {
				alignSelf: 'flex-end',
				...(isSmallWidthScreen ? {
					// Center on small screens, rather than float right.
					alignSelf: 'center',
				} : {}),
				paddingRight: menuGapRight,
				paddingLeft: menuGapLeft,
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
				justifyContent: 'flex-end',
				flexDirection: 'column',
			},
		});
	}, [theme, safeAreaPadding, windowWidth]);
};

const BottomDrawer: React.FC<Props> = props => {
	const theme = themeStyle(props.themeId);
	const styles = useStyles(theme);
	const menu = <ScrollView style={styles.outerContainer} testID='drawer-outer-container'>
		<View style={styles.contentContainer}>
			{props.children}
		</View>
	</ScrollView>;

	return <Modal
		visible={props.visible}
		onDismiss={props.onDismiss}
		onRequestClose={props.onDismiss}
		animationType='fade'
		backgroundColor={theme.backgroundColorTransparent2}
		transparent
		modalBackgroundStyle={styles.modalBackground}
		containerStyle={styles.menuStyle}
	>{menu}</Modal>;
};

export default connect((state: AppState) => {
	return {
		themeId: state.settings.theme,
	};
})(BottomDrawer);
