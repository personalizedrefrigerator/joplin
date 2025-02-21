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
	mk: MasterKeyEntity;
	masterPasswordKeys: PasswordChecks;
	passwordChecks: PasswordChecks;
}

const EncryptionKeyItem: React.FC<Props> = ({
	themeId, mk, masterPasswordKeys, passwordChecks,
}) => {
	const theme = themeStyle(themeId);
	const styles = useStyles(themeId);

	const [password, setPassword] = useState('');
	const passwordOk = passwordChecks[mk.id] === true;
	const passwordOkIcon = passwordOk ? '✔' : '❌';

	const onSaveClick = useCallback(async () => {
		onSavePasswordClick(mk, password);
	}, [mk, password]);

	const renderPasswordInput = (masterKeyId: string) => {
		if (masterPasswordKeys[masterKeyId] || !passwordChecks['master']) {
			return (
				<Text style={{ ...styles.normalText, color: theme.colorFaded, fontStyle: 'italic' }}>({_('Master password')})</Text>
			);
		} else {
			return (
				<View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
					<TextInput
						selectionColor={theme.textSelectionColor}
						keyboardAppearance={theme.keyboardAppearance}
						secureTextEntry={true}
						defaultValue={password}
						onChangeText={setPassword}
						style={styles.inputStyle}
					></TextInput>
					<Text
						style={styles.statusIcon}
						accessibilityRole='image'
						accessibilityLabel={passwordOk ? _('Valid') : _('Invalid password')}
					>{passwordOkIcon}</Text>
					<Button
						title={_('Save')}
						onPress={onSaveClick}
					></Button>
				</View>
			);
		}
	};

	return (
		<View key={mk.id}>
			<Text
				style={styles.titleText}
				accessibilityRole='header'
			>{_('Master Key %s', mk.id.substring(0, 6))}</Text>
			<Text style={styles.normalText}>{_('Created: %s', time.formatMsToLocal(mk.created_time))}</Text>
			<View style={{ flexDirection: 'row', alignItems: 'center' }}>
				<Text style={{ flex: 0, fontSize: theme.fontSize, marginRight: 10, color: theme.color }}>{_('Password:')}</Text>
				{renderPasswordInput(mk.id)}
			</View>
		</View>
	);

};

export default EncryptionKeyItem;
