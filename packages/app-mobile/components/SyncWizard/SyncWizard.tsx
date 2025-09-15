import * as React from 'react';
import DismissibleDialog, { DialogSize } from '../DismissibleDialog';
import { AppState } from '../../utils/types';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';
import { useCallback } from 'react';
import { Icon, Text } from 'react-native-paper';
import { _ } from '@joplin/lib/locale';
import JoplinCloudIcon from './JoplinCloudIcon';
import NavService from '@joplin/lib/services/NavService';
import { Platform, StyleSheet, View } from 'react-native';
import Setting, { Env } from '@joplin/lib/models/Setting';
import CardButton from '../buttons/CardButton';

interface Props {
	dispatch: Dispatch;
	visible: boolean;
	themeId: number;
}

const iconSize = 24;
const styles = StyleSheet.create({
	icon: {
		width: iconSize,
	},
	titleContainer: {
		flexDirection: 'row',
		gap: 8,
		paddingBottom: 6,
		alignItems: 'center',
	},
	cardContent: {
		padding: 12,
		borderRadius: 14,
	},
	syncProviderCard: {
		marginBottom: 2,
	},
	listItem: {
		flexDirection: 'row',
		gap: 8,
		marginVertical: 6,
		verticalAlign: 'middle',
	},
});

interface SyncProviderProps {
	title: string;
	icon: ()=> React.ReactNode;
	description: string;
	onPress: ()=> void;
	featuresList: string[];
	disabled: boolean;
}

const SyncProvider: React.FC<SyncProviderProps> = props => {
	return <CardButton
		disabled={props.disabled}
		style={styles.syncProviderCard}
		onPress={props.onPress}
	>
		<View style={styles.cardContent}>
			<View style={styles.titleContainer}>
				{props.icon()}
				<Text variant='titleMedium'>{props.title}{props.disabled ? ' (Not supported)' : ''}</Text>
			</View>
			{props.description && <Text variant='titleSmall'>{props.description}</Text>}
			{props.featuresList.map((feature, index) => (
				<View key={`feature-${index}`} style={styles.listItem}>
					<Icon size={14} source='check'/><Text>{feature}</Text>
				</View>
			))}
		</View>
	</CardButton>;
};

const isJoplinCloudSupported = () => {
	if (Platform.OS !== 'web') return true;

	// At present, Joplin Cloud sync is not supported with self-hosted web apps. This may change
	// in the future:
	const supportedDomains = ['app.joplincloud.com'];
	if (Setting.value('env') === Env.Dev) {
		supportedDomains.push('localhost');
	}
	return supportedDomains.includes(location.hostname);
};

const SyncWizard: React.FC<Props> = ({ themeId, visible, dispatch }) => {
	const onDismiss = useCallback(() => {
		dispatch({
			type: 'SYNC_WIZARD_VISIBLE_CHANGE',
			visible: false,
		});
	}, [dispatch]);

	const onSelectJoplinCloud = useCallback(async () => {
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
		<Text variant='titleMedium' role='heading'>{
			_('Joplin can synchronise your notes using various providers. Select one from the list below.')
		}</Text>
		<SyncProvider
			title={_('Joplin Cloud')}
			description={_('Joplin\'s own sync service. Also gives access to Joplin-specific features such as publishing notes or collaborating on notebooks with others.')}
			featuresList={[
				_('Sync your notes'),
				_('Publish notes to the internet'),
				_('Collaborate on notebooks with others'),
			]}
			icon={() => <JoplinCloudIcon style={styles.icon}/>}
			onPress={onSelectJoplinCloud}
			disabled={!isJoplinCloudSupported()}
		/>
		<SyncProvider
			title={_('Other')}
			description={_('Select one of the other supported sync targets.')}
			icon={() => <Icon size={iconSize} source='dots-horizontal-circle'/>}
			featuresList={[]}
			onPress={onSelectOtherTarget}
			disabled={false}
		/>
	</DismissibleDialog>;
};

export default connect((state: AppState) => ({
	visible: state.syncWizardVisible,
	themeId: state.settings.theme,
}))(SyncWizard);
