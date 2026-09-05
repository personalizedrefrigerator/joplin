import * as React from 'react';

import { UpdateSettingValueCallback } from './types';
import { View, Text } from 'react-native';
import Setting, { AppType, SettingItem } from '@joplin/lib/models/Setting';
import Dropdown from '../../Dropdown';
import { ConfigScreenStyles } from './configScreenStyles';
import SettingsToggle from './SettingsToggle';
import FileSystemPathSelector from './FileSystemPathSelector';
import ValidatedIntegerInput from './ValidatedIntegerInput';
import SettingTextInput from './SettingTextInput';
import shim from '@joplin/lib/shim';
import { themeStyle } from '../../global-style';
import SettingsButton from './SettingsButton';
import { RefObject, useCallback, useState } from 'react';
import { SettingsMap } from '@joplin/lib/components/shared/config/config-shared';

interface Props {
	settingId: string;
	value: unknown;

	settingsRef: RefObject<SettingsMap>;

	styles: ConfigScreenStyles;
	themeId: number;

	updateSettingValue: UpdateSettingValueCallback;
}


const SettingComponent: React.FunctionComponent<Props> = props => {
	const themeId = props.themeId;
	const theme = themeStyle(themeId);
	const output: React.ReactElement | null = null;

	const md = Setting.settingMetadata(props.settingId);
	const settingDescription = md.description ? md.description(AppType.Mobile) : '';

	const styleSheet = props.styles.styleSheet;

	const descriptionComp = !settingDescription ? null : <Text style={styleSheet.settingDescriptionText}>{settingDescription}</Text>;
	const containerStyles = props.styles.getContainerStyle(!!settingDescription);

	if (md.isEnum) {
		const value = props.value?.toString();

		const items = Setting.enumOptionsToValueLabels(md.options(), md.optionsOrder ? md.optionsOrder() : []);
		const label = md.label();

		return (
			<View key={props.settingId} style={containerStyles.outerContainer}>
				<View style={containerStyles.innerContainer}>
					<Text key="label" style={styleSheet.settingText}>
						{label}
					</Text>
					<Dropdown
						key="control"
						items={items}
						selectedValue={value}
						itemListStyle={{
							backgroundColor: theme.backgroundColor,
						}}
						headerStyle={{
							color: theme.color,
							fontSize: theme.fontSize,
						}}
						itemStyle={{
							color: theme.color,
							fontSize: theme.fontSize,
						}}
						onValueChange={(itemValue: string) => {
							void props.updateSettingValue(props.settingId, itemValue);
						}}
						accessibilityHint={label}
					/>
				</View>
				{descriptionComp}
			</View>
		);
	} else if (md.type === Setting.TYPE_BOOL) {
		return (
			<SettingsToggle
				settingId={props.settingId}
				value={!!props.value}
				themeId={props.themeId}
				styles={props.styles}
				label={md.label()}
				updateSettingValue={props.updateSettingValue}
				description={descriptionComp}
			/>
		);
	} else if (md.type === Setting.TYPE_INT) {
		return (
			<ValidatedIntegerInput
				settingId={props.settingId}
				value={props.value as number}
				themeId={props.themeId}
				styles={props.styles}
				label={md.label()}
				updateSettingValue={props.updateSettingValue}
				description={descriptionComp}
			/>
		);
	} else if (md.type === Setting.TYPE_STRING) {
		if (['sync.2.path', 'plugins.devPluginPaths'].includes(md.key) && (shim.fsDriver().isUsingAndroidSAF() || shim.mobilePlatform() === 'web')) {
			return (
				<FileSystemPathSelector
					themeId={props.themeId}
					mode={md.key === 'sync.2.path' ? 'readwrite' : 'read'}
					styles={props.styles}
					settingMetadata={md}
					updateSettingValue={props.updateSettingValue}
					description={descriptionComp}
				/>
			);
		}

		return (
			<SettingTextInput
				settingId={props.settingId}
				value={props.value as string}
				themeId={props.themeId}
				styles={props.styles}
				label={md.label()}
				updateSettingValue={props.updateSettingValue}
				description={descriptionComp}
			/>
		);
	} else if (md.type === Setting.TYPE_BUTTON) {
		return (
			<SettingButtonComponent
				metadata={md}
				styles={props.styles}
				onUpdateSettingValue={props.updateSettingValue}
				settingsRef={props.settingsRef}
			/>
		);
	} else if (Setting.value('env') === 'dev') {
		throw new Error(`Unsupported setting type: ${md.type}`);
	}

	return output;
};

export default SettingComponent;

interface SettingButtonProps {
	metadata: SettingItem;
	styles: ConfigScreenStyles;
	settingsRef: RefObject<SettingsMap>;
	onUpdateSettingValue: UpdateSettingValueCallback;
}

const SettingButtonComponent: React.FC<SettingButtonProps> = ({ metadata, styles, onUpdateSettingValue, settingsRef }) => {
	const key = metadata.key;
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
						void onUpdateSettingValue(key, value);
					},
					settings: settingsRef.current,
				});
			} catch (error) {
				setError(String(error));
			} finally {
				setLoading(false);
			}
		} else {
			void shim.showErrorDialog('Invalid setting: No click handler');
		}
	}, [onUpdateSettingValue, md, settingsRef]);

	return <>
		<SettingsButton
			title={md.label()}
			styles={styles}
			clickHandler={onClick}
			disabled={loading}
		/>
		{error && <span className='error'>{error}</span>}
	</>;
};
