import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { themeStyle } from './global-style';
import { _ } from '@joplin/lib/locale';
import { View, Button, Text, StyleSheet } from 'react-native';
import time from '@joplin/lib/time';
import { Platform } from 'react-native';
import Modal from './Modal';
import { formatMsToLocal } from '@joplin/utils/time';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

const styles = StyleSheet.create({
	centeredView: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalView: {
		display: 'flex',
		flexDirection: 'column',
		margin: 10,
		backgroundColor: 'white',
		borderRadius: 10,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5,
	},
	button: {
		borderRadius: 20,
		padding: 10,
		elevation: 2,
	},
	buttonOpen: {
		backgroundColor: '#F194FF',
	},
	buttonClose: {
		backgroundColor: '#2196F3',
	},
	textStyle: {
		color: 'white',
		fontWeight: 'bold',
		textAlign: 'center',
	},
	modalText: {
		marginBottom: 15,
		textAlign: 'center',
	},
});

interface SelectDateTimeDialogProps {
	themeId: number;
	shown: boolean;
	date: Date | null;
	onAccept?: (date: Date | null)=> void;
	onReject?: ()=> void;
}

const SelectDateTimeDialog: React.FC<SelectDateTimeDialogProps> = props => {
	const { themeId, shown, date: propsDate, onAccept, onReject } = props;

	const [date, setDate] = useState<Date | null>(propsDate);
	const [showPicker, setShowPicker] = useState(false);

	useEffect(() => {
		setDate(propsDate);
	}, [propsDate]);

	const onAccept_ = useCallback(() => {
		if (onAccept) onAccept(date);
	}, [onAccept, date]);

	const onReject_ = useCallback(() => {
		if (onReject) onReject();
	}, [onReject]);

	const onClear = useCallback(() => {
		if (onAccept) onAccept(null);
	}, [onAccept]);

	const onPickerConfirm = useCallback((selectedDate: Date) => {
		setDate(selectedDate);
		setShowPicker(false);
	}, []);

	const onPickerCancel = useCallback(() => {
		setShowPicker(false);
	}, []);

	const onSetDate = useCallback(() => {
		setShowPicker(true);
	}, []);

	// web
	const onInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		setDate(new Date(event.target.value));
	}, []);

	const renderContent = () => {
		const theme = themeStyle(themeId);

		// DateTimePickerModal doesn't support web.
		if (Platform.OS === 'web') {
			// See https://developer.mozilla.org/en-US/docs/Web/HTML/Date_and_time_formats#local_date_and_time_strings
			// for the expected date input format:
			const dateString = date ? formatMsToLocal(date.getTime(), 'YYYY-MM-DD[T]HH:mm:ss') : '';
			return <input
				type="datetime-local"
				value={dateString}
				onChange={onInputChange}
			></input>;
		}

		return (
			<View style={{ flex: 0, margin: 20, alignItems: 'center' }}>
				<View style={{ flexDirection: 'row', alignItems: 'center' }}>
					{ date && <Text style={{ ...theme.normalText, color: theme.color, marginRight: 10 }}>{time.formatDateToLocal(date)}</Text> }
					<Button title="Set date" onPress={onSetDate} />
				</View>
				<DateTimePickerModal
					date={date ? date : new Date()}
					is24Hour={time.use24HourFormat()}
					isVisible={showPicker}
					mode="datetime"
					onConfirm={onPickerConfirm}
					onCancel={onPickerCancel}
				/>
			</View>
		);
	};

	if (!shown) return null;

	const theme = themeStyle(themeId);

	return (
		<Modal
			visible={shown}
			containerStyle={styles.centeredView}
			onClose={onReject_}
		>
			<View style={{ ...styles.modalView, backgroundColor: theme.backgroundColor }}>
				<View style={{ padding: 15, flexBasis: 'auto', paddingBottom: 0, flexGrow: 0, width: '100%', borderBottomWidth: 1, borderBottomColor: theme.dividerColor }}>
					<Text style={{ ...styles.modalText, color: theme.color, fontSize: 14, fontWeight: 'bold' }}>{_('Set alarm')}</Text>
				</View>
				{renderContent()}
				<View style={{ padding: 20, flexBasis: 'auto', borderTopWidth: 1, borderTopColor: theme.dividerColor }}>
					<View style={{ marginBottom: 10 }}>
						<Button title={_('Save alarm')} onPress={onAccept_} key="saveButton" />
					</View>
					<View style={{ marginBottom: 10 }}>
						<Button title={_('Clear alarm')} onPress={onClear} key="clearButton" />
					</View>
					<View style={{ marginBottom: 10 }}>
						<Button title={_('Cancel')} onPress={onReject_} key="cancelButton" />
					</View>
				</View>
			</View>
		</Modal>
	);
};

export default React.memo(SelectDateTimeDialog);
