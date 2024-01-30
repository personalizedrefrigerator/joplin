
import { SettingItem } from '@joplin/lib/models/Setting';
import * as React from 'react';
import { View } from 'react-native';
import { Button, Card, Switch, Text } from 'react-native-paper';
import { ConfigScreenStyleSheet } from './configScreenStyles';
import Slider from '@react-native-community/slider';
import { useMemo, useState } from 'react';
import { join } from 'path';
import { DocumentDirectoryPath } from 'react-native-fs';
import Logger from '@joplin/utils/Logger';
import shim from '@joplin/lib/shim';
import NavService from '@joplin/lib/services/NavService';

interface Props {
	metadata: SettingItem;
	value: number;
	styleSheet: ConfigScreenStyleSheet;
	onChange: (value: number)=> void;
}

const sliderLogger = Logger.create('SliderLogger');

const pullSliderLogs = async () => {
	const logFilePath = join(DocumentDirectoryPath, 'log.txt');
	sliderLogger.info('');
	sliderLogger.info('-----------------------');
	sliderLogger.info(await shim.fsDriver().readFile(logFilePath));
	sliderLogger.info('-----------------------');

	// Clear the file
	await shim.fsDriver().writeFile(logFilePath, '', 'utf8');

	void NavService.go('Log', { defaultFilter: 'SliderLogger' });
};

const SettingsSlider: React.FC<Props> = props => {
	const md = props.metadata;
	const unitLabel = md.unitLabel ? md.unitLabel(props.value) : props.value;
	const minimum = 'minimum' in md ? md.minimum : 0;
	const maximum = 'maximum' in md ? md.maximum : 10;

	const [showSlider, setShowSlider] = useState(false);
	const [includeStyle, setIncludeStyle] = useState(true);
	const [includeStep, setIncludeStep] = useState(true);
	const [includeMin, setIncludeMin] = useState(true);
	const [includeMax, setIncludeMax] = useState(true);
	const [includeInitialValue, setIncludeInitialValue] = useState(true);
	const [includeOnChange, setIncludeOnChange] = useState(true);
	const [hardcodeWidth, setHardcodeWidth] = useState(false);

	const style = useMemo(() => ({
		flex: hardcodeWidth ? 0 : 1, ...(hardcodeWidth ? { width: 100 } : null),
	}), [hardcodeWidth]);
	const [sliderKey, setSliderKey] = useState(0);

	const sliderComponent = showSlider ? (
		<Slider
			key={`slider-${sliderKey}`}
			{...(includeStyle ? { style } : null)}
			{...(includeStep ? { step: md.step } : null)}
			{...(includeMin ? { minimumValue: minimum } : null)}
			{...(includeMax ? { maximumValue: maximum } : null)}
			{...(includeInitialValue ? { value: props.value } : null)}
			{...(includeOnChange ? { onValueChange: props.onChange } : null)}
		/>
	) : null;

	const renderSwitch = (label: string, value: boolean, onChange: (v: boolean)=> void) => {
		return (
			<View style={{ flexDirection: 'row' }}>
				<Text>{label}</Text>
				<Switch value={value} onValueChange={onChange} />
			</View>
		);
	};

	return (
		<View style={{ flexDirection: 'column', flex: 1, alignItems: 'stretch', padding: 4 }}>
			<Card mode='outlined'>
				<Card.Title title="Slider options"/>
				<Card.Content>
					{renderSwitch('Show slider', showSlider, setShowSlider)}
					{renderSwitch('Apply styles', includeStyle, setIncludeStyle)}
					{renderSwitch('Hardcode width?', hardcodeWidth, setHardcodeWidth)}
					{renderSwitch('Register an onChange listener?', includeOnChange, setIncludeOnChange)}
					{renderSwitch('Set include step', includeStep, setIncludeStep)}
					{renderSwitch('Set include minimum', includeMin, setIncludeMin)}
					{renderSwitch('Set include maximum', includeMax, setIncludeMax)}
					{renderSwitch('Apply an initial value', includeInitialValue, setIncludeInitialValue)}
				</Card.Content>
				<Card.Actions>
					<Button onPress={pullSliderLogs}>Pull logs</Button>
					<Button onPress={() => setSliderKey(sliderKey + 1)}>Reload slider</Button>
				</Card.Actions>
			</Card>

			<View style={props.styleSheet.settingContainer}>
				<Text key="label" style={props.styleSheet.settingText}>
					{md.label()}
				</Text>
				<View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', flex: 1 }}>
					<Text style={props.styleSheet.sliderUnits}>{unitLabel}</Text>
					{sliderComponent}
				</View>
			</View>
		</View>
	);
};

export default SettingsSlider;
