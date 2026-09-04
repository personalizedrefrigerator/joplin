import * as React from 'react';
import { SettingsRecord } from '@joplin/lib/models/Setting';
import NavService from '@joplin/lib/services/NavService';
import Button, { ButtonLevel } from '../../Button/Button';
import { _ } from '@joplin/lib/locale';
import SyncTargetRegistry from '@joplin/lib/SyncTargetRegistry';
import { showJoplinServerUsernamePassword } from '@joplin/lib/models/settings/builtInMetadata';
import { OnUpdateSettingValue } from '../types';
import { isJoplinOAuthSyncTarget } from '@joplin/lib/services/joplinCloudUtils';

interface Props {
	settings: SettingsRecord;
	rowStyle: React.CSSProperties;
	onUpdateSettingValue: OnUpdateSettingValue;
}

const JoplinServerOAuthButton: React.FC<Props> = ({ settings, rowStyle, onUpdateSettingValue }) => {
	const syncTarget = settings['sync.target'];
	const supportsJoplinOAuth = isJoplinOAuthSyncTarget(syncTarget);
	const isJoplinServer = settings['sync.target'] === SyncTargetRegistry.nameToId('joplinServer');
	if (!supportsJoplinOAuth) return null;
	const showingUsernameAndPassword = showJoplinServerUsernamePassword(settings);
	if (isJoplinServer && showingUsernameAndPassword) return null;

	const goToJoplinCloudLogin = () => {
		void NavService.go('JoplinCloudLogin', {
			syncTarget: settings['sync.target'],
		});
	};

	const onLogout = () => {
		onUpdateSettingValue({
			key: `sync.${syncTarget}.username`,
			value: '',
		});
		onUpdateSettingValue({
			key: `sync.${syncTarget}.password`,
			value: '',
		});
	};

	const syncTargetLabel = SyncTargetRegistry.idToMetadata(settings['sync.target']).label;
	return <>
		<div style={rowStyle}>
			{isJoplinServer && !!settings['sync.9.username'] && (
				<Button
					title={_('Disconnect from %s', syncTargetLabel)}
					onClick={onLogout}
				/>
			)}
		</div>
		<div style={rowStyle}>
			<Button
				title={_('Connect to %s', syncTargetLabel)}
				level={ButtonLevel.Primary}
				onClick={goToJoplinCloudLogin}
			/>
		</div>
	</>;
};

export default JoplinServerOAuthButton;
