import * as React from 'react';
import DismissibleDialog, { DialogSize } from '../DismissibleDialog';
import { AppState } from '../../utils/types';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { useCallback } from 'react';
import { Icon, List, Text } from 'react-native-paper';
import { _ } from '@joplin/lib/locale';
import JoplinCloudIcon from './JoplinCloudIcon';
import NavService from '@joplin/lib/services/NavService';

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
		onDismiss();
		await NavService.go('JoplinCloudLogin');
	}, [onDismiss]);

	const onSelectOtherTarget = useCallback(async () => {
		onDismiss();
		await NavService.go('Config', { sectionName: 'sync' });
	}, [onDismiss]);

	return <DismissibleDialog
		themeId={themeId}
		visible={visible}
		onDismiss={onDismiss}
		size={DialogSize.Small}
		heading={_('Sync')}
	>
		<Text variant='headlineMedium'>{_('Select a synchronization option:')}</Text>
		<List.Item
			title={_('Joplin Cloud')}
			description={_('A synchronisation service built for Joplin.')}
			left={_props => <JoplinCloudIcon style={{ width: 84 }}/>}
			onPress={onSelectSuggestedTarget}
		/>
		<List.Item
			title={_('Other')}
			description={_('View all synchronization options.')}
			left={props => <Icon {...props} size={84} source='dots-horizontal-circle'/>}
			onPress={onSelectOtherTarget}
		/>
	</DismissibleDialog>;
};

export default connect((state: AppState) => ({
	visible: state.syncWizardVisible,
	themeId: state.settings.theme,
}))(SyncWizard);
