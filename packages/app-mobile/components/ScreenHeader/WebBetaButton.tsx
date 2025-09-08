import * as React from 'react';
import { Linking, TextStyle, View, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import IconButton from '../IconButton';
import { _ } from '@joplin/lib/locale';
import { useCallback, useState } from 'react';
import DismissibleDialog, { DialogSize } from '../DismissibleDialog';
import { LinkButton } from '../buttons';

interface Props {
	wrapperStyle: ViewStyle;
	iconStyle: TextStyle;
	themeId: number;
}

const onLeaveFeedback = () => {
	void Linking.openURL('https://forms.gle/B5YGDNzsUYBnoPx19');
};

const feedbackContainerStyles: ViewStyle = { flexGrow: 1, justifyContent: 'flex-end' };

const WebBetaButton: React.FC<Props> = props => {
	const [dialogVisible, setDialogVisible] = useState(false);

	const onShowDialog = useCallback(() => {
		setDialogVisible(true);
	}, []);

	const onHideDialog = useCallback(() => {
		setDialogVisible(false);
	}, []);

	return (
		<>
			<IconButton
				onPress={onShowDialog}
				description={_('Beta')}
				themeId={props.themeId}
				contentWrapperStyle={props.wrapperStyle}

				iconName="material beta"
				iconStyle={props.iconStyle}
			/>
			<DismissibleDialog
				heading={_('Beta')}
				size={DialogSize.Small}
				themeId={props.themeId}
				visible={dialogVisible}
				onDismiss={onHideDialog}
			>
				<Text>Welcome to the beta version of the Joplin Web App!</Text>
				<Text>Thank you for participating in the beta version of the Joplin Web App.</Text>
				<Text>The Joplin Web App is available for a limited time in open beta and may later join the Joplin Cloud plans.</Text>
				<Text>Feel free to use it and let us know if have any question or notice any issue!</Text>
				<View style={feedbackContainerStyles}>
					<LinkButton onPress={onLeaveFeedback}>{'Give feedback'}</LinkButton>
				</View>
			</DismissibleDialog>
		</>
	);
};

export default WebBetaButton;
