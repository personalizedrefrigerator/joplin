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
	void Linking.openURL('https://discourse.joplinapp.org/t/web-client-running-joplin-mobile-in-a-web-browser-with-react-native-web/38749');
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
				size={DialogSize.Small}
				themeId={props.themeId}
				visible={dialogVisible}
				onDismiss={onHideDialog}
			>
				<Text variant='headlineMedium'>{_('Beta')}</Text>
				<Text>{'At present, the web client is in beta. In the future, it may change significantly, or be removed.'}</Text>
				<Text>{'NOTE: This deployment of the web client is intended to allow users to test proposed changes to Joplin. See app.joplincloud.com for the production version of the web app.'}</Text>
				<View style={feedbackContainerStyles}>
					<LinkButton onPress={onLeaveFeedback}>{_('Give feedback')}</LinkButton>
					<LinkButton onPress={() => Linking.openURL('https://app.joplincloud.com/')}>{'app.joplincloud.com'}</LinkButton>
				</View>
			</DismissibleDialog>
		</>
	);
};

export default WebBetaButton;
