import * as React from 'react';
import { SettingsRecord } from '@joplin/lib/models/Setting';
import NavService from '@joplin/lib/services/NavService';
import Button, { ButtonLevel } from '../../Button/Button';
import { _ } from '@joplin/lib/locale';
import SyncTargetRegistry from '@joplin/lib/SyncTargetRegistry';
import { showJoplinServerUsernamePassword } from '@joplin/lib/models/settings/builtInMetadata';
import { OnUpdateSettingValue } from '../types';
import { fetchLoginUrl, isJoplinOAuthSyncTarget } from '@joplin/lib/services/joplinCloudUtils';
import { useCallback, useRef, useState } from 'react';
import Logger from '@joplin/utils/Logger';

const logger = Logger.create('JoplinServerOAuthButton');

interface Props {
	settings: SettingsRecord;
	rowStyle: React.CSSProperties;
	onUpdateSettingValue: OnUpdateSettingValue;
}

const JoplinServerOAuthButton: React.FC<Props> = ({ settings, rowStyle, onUpdateSettingValue }) => {
	const syncTarget = settings['sync.target'];
	const isJoplinServer = settings['sync.target'] === SyncTargetRegistry.nameToId('joplinServer');

	const onLogout = useCallback(() => {
		onUpdateSettingValue({
			key: `sync.${syncTarget}.username`,
			value: '',
		});
		onUpdateSettingValue({
			key: `sync.${syncTarget}.password`,
			value: '',
		});
	}, [syncTarget, onUpdateSettingValue]);

	const showButton = useCanShowOAuthButton(settings);
	const { onConnect, loading, error } = useOnConnectClick(settings, onUpdateSettingValue);

	const syncTargetLabel = SyncTargetRegistry.idToMetadata(settings['sync.target']).label;
	return showButton && <>
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
				disabled={loading}
				onClick={onConnect}
			/>
			{error && <span className='error'>{error}</span>}
		</div>
	</>;
};

const useOnConnectClick = (settings: SettingsRecord, onUpdateSettingValue: OnUpdateSettingValue) => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string|null>(null);
	const syncTargetId = settings['sync.target'];
	const apiBaseUrl = settings[`sync.${syncTargetId as 9|10}.path`];

	const loadingRef = useRef(loading);
	loadingRef.current = loading;

	const onShowUsernamePasswordAuth = useCallback(() => {
		if (syncTargetId !== 9) throw new Error(`Unable to show username/password fields for target ${syncTargetId}`);
		onUpdateSettingValue({
			key: `sync.${syncTargetId}.preferPasswordAuth`,
			value: true,
		});
	}, [onUpdateSettingValue, syncTargetId]);

	const onConnect = useCallback(async () => {
		if (loadingRef.current) return;

		setLoading(true);
		try {
			const loginUrl = await fetchLoginUrl(syncTargetId, apiBaseUrl);
			if (!loginUrl) {
				onShowUsernamePasswordAuth();
			} else {
				void NavService.go('JoplinCloudLogin', {
					syncTarget: syncTargetId,
					websiteUrl: loginUrl,
				});
			}
		} catch (error) {
			logger.warn('Error fetching login URL', error);
			setError(error);
		} finally {
			setLoading(false);
		}
	}, [syncTargetId, apiBaseUrl, onShowUsernamePasswordAuth]);

	return { loading, error, onConnect: loading ? null : onConnect };
};

const useCanShowOAuthButton = (settings: SettingsRecord) => {
	const syncTarget = settings['sync.target'];
	const supportsJoplinOAuth = isJoplinOAuthSyncTarget(syncTarget);
	const isJoplinServer = settings['sync.target'] === SyncTargetRegistry.nameToId('joplinServer');
	if (!supportsJoplinOAuth) return false;
	const showingUsernameAndPassword = showJoplinServerUsernamePassword(settings);
	if (isJoplinServer && showingUsernameAndPassword) return false;
	return true;
};

export default JoplinServerOAuthButton;
