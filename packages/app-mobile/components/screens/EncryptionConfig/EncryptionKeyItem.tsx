import * as React from 'react';
import { themeStyle } from '../../global-style';
import { MasterKeyEntity } from '@joplin/lib/services/e2ee/types';
import { PasswordChecks, onSavePasswordClick } from '@joplin/lib/components/EncryptionConfigScreen/utils';
import { useCallback, useState } from 'react';
import { Text, View, Button, TextInput } from 'react-native';
import { _ } from '@joplin/lib/locale';
import time from '@joplin/lib/time';
import useStyles from './utils/useStyles';


interface Props {
	themeId: number;
	masterKey: MasterKeyEntity;
	passwords: Record<string, string>;
	masterPasswordKeys: PasswordChecks;
	passwordChecks: PasswordChecks;
}

const EncryptionKeyItem: React.FC<Props> = ({
	themeId, masterKey: mk, masterPasswordKeys, passwordChecks, passwords,
}) => {
	const theme = themeStyle(themeId);
	const styles = useStyles(themeId);

	const initialPassword = passwords[mk.id] ?? '';
	const [password, setPassword] = useState(initialPassword);
	const passwordOk = passwordChecks[mk.id] === true;
	const passwordStatusIcon = passwordOk ? '✔' : '❌';

	const onSaveClick = useCallback(async () => {
		onSavePasswordClick(mk, password);
	}, [mk, password]);

	const renderPasswordInput = () => {
		if (masterPasswordKeys[mk.id] || !passwordChecks['master']) {
			return (
				<Text style={{ ...styles.normalText, color: theme.colorFaded, fontStyle: 'italic' }}>({_('Master password')})</Text>
			);
		} else {
			const saveTitle = _('Save');
			const passwordStatusLabel = passwordOk ? _('Valid') : _('Invalid password');
			return (
				<View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
					<TextInput
						selectionColor={theme.textSelectionColor}
						keyboardAppearance={theme.keyboardAppearance}
						secureTextEntry={true}
						defaultValue={password}
						onChangeText={setPassword}
						style={styles.inputStyle}
					/>
					<Text
						style={styles.statusIcon}
						accessibilityRole='image'
						accessibilityLabel={passwordStatusLabel}
					>{passwordStatusIcon}</Text>
					<Button
						title={saveTitle}
						onPress={onSaveClick}
					/>
				</View>
			);
		}
	};

	return (
		<View>
			<Text
				style={styles.titleText}
				accessibilityRole='header'
			>{_('Master Key %s', mk.id.substring(0, 6))}</Text>
			<Text style={styles.normalText}>{_('Created: %s', time.formatMsToLocal(mk.created_time))}</Text>
			<View style={{ flexDirection: 'row', alignItems: 'center' }}>
				<Text style={{ flex: 0, fontSize: theme.fontSize, marginRight: 10, color: theme.color }}>{_('Password:')}</Text>
				{renderPasswordInput()}
			</View>
		</View>
	);

};

export default EncryptionKeyItem;
