import * as React from 'react';
import { useMemo } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { themeStyle } from './global-style';
import { _ } from '@joplin/lib/locale';

import Modal from './Modal';
import { PrimaryButton, SecondaryButton } from './buttons';

interface Props {
	themeId: number;
	children: React.ReactNode;

	buttonBarEnabled: boolean;
	title: string|null;
	onOkPress: ()=> void;
	onCancelPress: ()=> void;
}

const useStyles = (themeId: number) => {
	return useMemo(() => {
		const theme = themeStyle(themeId);
		return StyleSheet.create({
			container: {
				borderRadius: 4,
				backgroundColor: theme.backgroundColor,
				maxWidth: 600,
				maxHeight: 500,
				width: '100%',
				height: '100%',
				alignSelf: 'center',
				marginVertical: 'auto',
				flexGrow: 1,
				flexShrink: 1,
				padding: theme.margin,
			},
			title: theme.headerStyle,
			contentWrapper: {
				flexGrow: 1,
			},
			buttonRow: {
				flexDirection: 'row',
				alignContent: 'flex-end',
				gap: theme.margin,
			},
		});
	}, [themeId]);
};

const ModalDialog: React.FC<Props> = props => {
	const styles = useStyles(props.themeId);
	const theme = themeStyle(props.themeId);

	return (
		<Modal transparent={true} visible={true} onRequestClose={null} containerStyle={styles.container} backgroundColor={theme.backgroundColorTransparent2}>
			{props.title ? <Text style={styles.title} role='heading'>{props.title}</Text> : null}
			<View style={styles.contentWrapper}>{props.children}</View>
			<View style={styles.buttonRow}>
				<View style={{ flex: 1, marginLeft: 5 }}>
					<SecondaryButton disabled={!props.buttonBarEnabled} onPress={props.onCancelPress}>{_('Cancel')}</SecondaryButton>
				</View>
				<View style={{ flex: 1 }}>
					<PrimaryButton disabled={!props.buttonBarEnabled} onPress={props.onOkPress}>{_('OK')}</PrimaryButton>
				</View>
			</View>
		</Modal>
	);
};

export default ModalDialog;
