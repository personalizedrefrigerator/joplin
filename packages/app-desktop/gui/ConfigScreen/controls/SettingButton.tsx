import * as React from 'react';
import Setting from '@joplin/lib/models/Setting';
import { OnUpdateSettingValue } from '../types';
import Button, { ButtonLevel } from '../../Button/Button';
import { RefObject, useCallback, useState } from 'react';
import { SettingsMap } from '@joplin/lib/components/shared/config/config-shared';
import Logger from '@joplin/utils/Logger';

const logger = Logger.create('SettingButton');

interface Props {
	settingKey: string;
	settingsRef: RefObject<SettingsMap>;
	onUpdateSettingValue: OnUpdateSettingValue;
	onSettingButtonClick: (key: string)=> void;
}

const SettingButton: React.FC<Props> = ({
	settingKey, onUpdateSettingValue, onSettingButtonClick, settingsRef,
}) => {
	const key = settingKey;
	const md = Setting.settingMetadata(key);

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string|null>(null);

	const onClick = useCallback(async () => {
		if (md.onClick) {
			setError(null);
			setLoading(true);

			try {
				await md.onClick({
					setSettingValue: (key, value) => {
						onUpdateSettingValue({
							key, value,
						});
					},
					settings: settingsRef.current,
				});
			} catch (error) {
				logger.warn('Failed to run command for button', key, error);
				setError(String(error));
			} finally {
				setLoading(false);
			}
		} else {
			onSettingButtonClick(key);
		}
	}, [key, onSettingButtonClick, onUpdateSettingValue, md, settingsRef]);

	return <>
		<Button
			level={ButtonLevel.Secondary}
			title={md.label()}
			onClick={onClick}
			disabled={loading}
		/>
		{error && <span className='error'>{error}</span>}
	</>;
};

export default SettingButton;
