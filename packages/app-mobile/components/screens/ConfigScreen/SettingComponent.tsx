import * as React from 'react';

import { UpdateSettingValueCallback } from './types';
import { View, Text, TextInput } from 'react-native';
import Setting from '@joplin/lib/models/Setting';
import Dropdown from '../../Dropdown';
import { ConfigScreenStyles } from './configScreenStyles';
import SettingsToggle from './SettingsToggle';
import FileSystemPathSelector from './FileSystemPathSelector';
import shim from '@joplin/lib/shim';
import { useCallback } from 'react';
import SettingsSlider from './SettingsSlider';
const { themeStyle } = require('../../global-style.js');

interface Props {
	settingId: string;

	// The value associated with the given settings key
	value: any;

	styles: ConfigScreenStyles;
	themeId: number;

	updateSettingValue: UpdateSettingValueCallback;
}


const SettingComponent: React.FunctionComponent<Props> = props => {
	const themeId = props.themeId;
	const theme = themeStyle(themeId);
	const output: any = null;

	const md = Setting.settingMetadata(props.settingId);
	const settingDescription = md.description ? md.description() : '';

	const styleSheet = props.styles.styleSheet;

	const descriptionComp = !settingDescription ? null : <Text style={styleSheet.settingDescriptionText}>{settingDescription}</Text>;
	const containerStyle = props.styles.getContainerStyle(!!settingDescription);

	const handleChange = useCallback((itemValue: any) => {
		void props.updateSettingValue(props.settingId, itemValue);
	}, [props.updateSettingValue, props.settingId]);

	if (md.isEnum) {
		const value = props.value.toString();

		const items = Setting.enumOptionsToValueLabels(md.options(), md.optionsOrder ? md.optionsOrder() : []);

		return (
			<View key={props.settingId} style={{ flexDirection: 'column', borderBottomWidth: 1, borderBottomColor: theme.dividerColor }}>
				<View style={containerStyle}>
					<Text key="label" style={styleSheet.settingText}>
						{md.label()}
					</Text>
					<Dropdown
						key="control"
						items={items as any}
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
						onValueChange={handleChange}
					/>
				</View>
				{descriptionComp}
			</View>
		);
	} else if (md.type === Setting.TYPE_BOOL) {
		return (
			<SettingsToggle
				settingId={props.settingId}
				value={props.value}
				themeId={props.themeId}
				styles={props.styles}
				label={md.label()}
				updateSettingValue={props.updateSettingValue}
				description={descriptionComp}
			/>
		);
	} else if (md.type === Setting.TYPE_INT) {
		// Note: Do NOT add the minimumTrackTintColor and maximumTrackTintColor props
		// on the Slider as they are buggy and can crash the app on certain devices.
		// https://github.com/laurent22/joplin/issues/2733
		// https://github.com/react-native-community/react-native-slider/issues/161
		return (
			<View key={props.settingId}>
				<SettingsSlider
					metadata={md}
					value={props.value}
					styleSheet={styleSheet}
					onChange={handleChange}
				/>
			</View>
		);
	} else if (md.type === Setting.TYPE_STRING) {
		if (md.key === 'sync.2.path' && shim.fsDriver().isUsingAndroidSAF()) {
			return (
				<FileSystemPathSelector
					styles={props.styles}
					settingMetadata={md}
					updateSettingValue={props.updateSettingValue}
				/>
			);
		}

		return (
			<View key={props.settingId} style={{ flexDirection: 'column', borderBottomWidth: 1, borderBottomColor: theme.dividerColor }}>
				<View key={props.settingId} style={containerStyle}>
					<Text key="label" style={styleSheet.settingText}>
						{md.label()}
					</Text>
					<TextInput
						autoCorrect={false}
						autoComplete="off"
						selectionColor={theme.textSelectionColor}
						keyboardAppearance={theme.settingKeyboardAppearance}
						autoCapitalize="none"
						key="control"
						style={styleSheet.settingControl}
						value={props.value}
						onChangeText={handleChange}
						secureTextEntry={!!md.secure}
					/>
				</View>
				{descriptionComp}
			</View>
		);
	} else if (md.type === Setting.TYPE_BUTTON) {
		// TODO: Not yet supported
	} else if (Setting.value('env') === 'dev') {
		throw new Error(`Unsupported setting type: ${md.type}`);
	}

	return output;
};

export default SettingComponent;
