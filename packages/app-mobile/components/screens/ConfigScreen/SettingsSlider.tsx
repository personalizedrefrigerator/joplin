
import { SettingItem } from '@joplin/lib/models/Setting';
import * as React from 'react';
import { View } from 'react-native';
import { Button, Card, Switch, Text } from 'react-native-paper';
import { ConfigScreenStyleSheet } from './configScreenStyles';
import Slider from '@react-native-community/slider';
import { useMemo, useState } from 'react';

interface Props {
	metadata: SettingItem;
	value: number;
	styleSheet: ConfigScreenStyleSheet;
	onChange: (value: number)=> void;
}

const SettingsSlider: React.FC<Props> = props => {
	const md = props.metadata;
	const unitLabel = md.unitLabel ? md.unitLabel(props.value) : props.value;
	const minimum = 'minimum' in md ? md.minimum : 0;
	const maximum = 'maximum' in md ? md.maximum : 10;

	const [showSlider, setShowSlider] = useState(false);
	const [includeStyle, setIncludeStyle] = useState(false);
	const [includeStep, setIncludeStep] = useState(false);
	const [includeMin, setIncludeMin] = useState(false);
	const [includeMax, setIncludeMax] = useState(false);
	const [includeInitialValue, setIncludeInitialValue] = useState(false);
	const [includeOnChange, setIncludeOnChange] = useState(false);
	const [hardcodeWidth, setHardcodeWidth] = useState(true);

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
