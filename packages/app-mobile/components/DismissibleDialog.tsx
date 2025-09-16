import * as React from 'react';
import { useMemo } from 'react';
import { StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';
import { IconButton, Surface, Text } from 'react-native-paper';
import { themeStyle } from './global-style';
import Modal from './Modal';
import { _ } from '@joplin/lib/locale';

export enum DialogSize {
	// Small width, auto-determined height
	SmallResize = 'small-resize',

	Small = 'small',

	// Ideal for panels and dialogs that should be fullscreen even on large devices
	Large = 'large',
}

interface Props {
	themeId: number;
	visible: boolean;
	onDismiss: ()=> void;
	containerStyle?: ViewStyle;
	children: React.ReactNode;
	heading?: string;
	scrollOverflow?: boolean;

	size: DialogSize;
}

const useStyles = (themeId: number, containerStyle: ViewStyle, size: DialogSize) => {
	const windowSize = useWindowDimensions();

	return useMemo(() => {
		const theme = themeStyle(themeId);

		const maxWidth = size === DialogSize.Large ? windowSize.width : 500;
		const maxHeight = size === DialogSize.Large ? windowSize.height : 700;

		return StyleSheet.create({
			closeButtonContainer: {
				flexDirection: 'row',
				justifyContent: 'space-between',
				alignContent: 'center',
			},
			closeButton: {
				margin: 0,
			},
			heading: {
				alignSelf: 'center',
			},
			modalBackground: {
				justifyContent: 'center',
			},
			dialogContainer: {
				maxHeight,
				maxWidth,
				width: '100%',

				// Center
				marginLeft: 'auto',
				marginRight: 'auto',
				paddingLeft: 6,
				paddingRight: 6,

				...containerStyle,
			},
			dialogSurface: {
				borderRadius: 12,
				backgroundColor: theme.backgroundColor,
				padding: 10,
				width: '100%',

				...(size !== DialogSize.SmallResize ? {
					height: '100%',
				} : { }),
			},
		});
	}, [themeId, windowSize.width, windowSize.height, containerStyle, size]);
};

const DismissibleDialog: React.FC<Props> = props => {
	const theme = themeStyle(props.themeId);
	const styles = useStyles(props.themeId, props.containerStyle, props.size);

	const heading = props.heading ? (
		<Text variant='headlineSmall' role='heading' style={styles.heading}>{props.heading}</Text>
	) : null;
	const closeButtonRow = (
		<View style={styles.closeButtonContainer}>
			{heading ?? <View/>}
			<IconButton
				icon='close'
				accessibilityLabel={_('Close')}
				onPress={props.onDismiss}
				style={styles.closeButton}
			/>
		</View>
	);

	return (
		<Modal
			visible={props.visible}
			onDismiss={props.onDismiss}
			onRequestClose={props.onDismiss}
			containerStyle={styles.dialogContainer}
			modalBackgroundStyle={styles.modalBackground}
			animationType='fade'
			backgroundColor={theme.backgroundColorTransparent2}
			transparent={true}
			scrollOverflow={props.scrollOverflow}
			// Allows the modal background to extend under the statusbar
			statusBarTranslucent
		>
			<Surface style={styles.dialogSurface} elevation={1}>
				{closeButtonRow}
				{props.children}
			</Surface>
		</Modal>
	);
};

export default DismissibleDialog;
