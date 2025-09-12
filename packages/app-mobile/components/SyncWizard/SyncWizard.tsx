import * as React from 'react';
import DismissibleDialog, { DialogSize } from '../DismissibleDialog';
import { AppState } from '../../utils/types';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { useCallback } from 'react';
import { Text, TouchableRipple } from 'react-native-paper';
import { _ } from '@joplin/lib/locale';
import shim from '@joplin/lib/shim';
import JoplinCloudIcon from './JoplinCloudIcon';
import { View } from 'react-native';

interface Props {
	dispatch: Dispatch;
	visible: boolean;
	themeId: number;
}

const SyncWizard: React.FC<Props> = ({ themeId, visible, dispatch }) => {
	const onDismiss = useCallback(() => {
		dispatch({
			type: 'SYNC_WIZARD_VISIBLE_CHANGE',
			visible: false,
		});
	}, [dispatch]);

	const onSelectSuggestedTarget = useCallback(async () => {
		await shim.showErrorDialog('Not implemented');
	}, []);

	return <DismissibleDialog
		themeId={themeId}
		visible={visible}
		onDismiss={onDismiss}
		size={DialogSize.Small}
		heading={_('Sync')}
	>
		<Text variant='headlineMedium'>{_('Select a synchronization option:')}</Text>
		<TouchableRipple
			onPress={onSelectSuggestedTarget}
			role='button'
		>
			<View style={{ display: 'flex', flexDirection: 'row' }}>
				<JoplinCloudIcon/>
				<Text>Joplin Cloud</Text>
			</View>
		</TouchableRipple>
	</DismissibleDialog>;
};

export default connect((state: AppState) => ({
	visible: state.syncWizardVisible,
	themeId: state.settings.theme,
}))(SyncWizard);
