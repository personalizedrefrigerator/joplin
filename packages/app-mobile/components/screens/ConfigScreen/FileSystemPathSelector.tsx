import * as React from 'react';

import shim from '@joplin/lib/shim';
import { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { ConfigScreenStyles } from './configScreenStyles';
import { View, Text, StyleSheet } from 'react-native';
import Setting, { SettingItem } from '@joplin/lib/models/Setting';
import { openDocumentTree } from '@joplin/react-native-saf-x';
import { UpdateSettingValueCallback } from './types';
import { reg } from '@joplin/lib/registry';
import type FsDriverWeb from '../../../utils/fs-driver/fs-driver-rn.web';
import { TouchableRipple } from 'react-native-paper';
import { _ } from '@joplin/lib/locale';
import IconButton from '../../IconButton';

interface Props {
	themeId: number;
	styles: ConfigScreenStyles;
	settingMetadata: SettingItem;
	mode: 'read'|'readwrite';
	updateSettingValue: UpdateSettingValueCallback;
}

type ExtendedSelf = (typeof window.self) & {
	showDirectoryPicker: (options: { id: string; mode: string })=> Promise<FileSystemDirectoryHandle>;
};
declare const self: ExtendedSelf;

const styles = StyleSheet.create({
	container: {
		paddingTop: 0,
		paddingLeft: 0,
		paddingRight: 0,
		paddingBottom: 0,
	},
	mainButton: {
		flexGrow: 1,
		flexShrink: 1,
		padding: 22,
		margin: 0,
	},
	buttonContent: {
		flexDirection: 'row',
	},
});

const FileSystemPathSelector: FunctionComponent<Props> = props => {
	const [fileSystemPath, setFileSystemPath] = useState<string>('');

	const settingId = props.settingMetadata.key;

	useEffect(() => {
		setFileSystemPath(Setting.value(settingId));
	}, [settingId]);

	const selectDirectoryButtonPress = useCallback(async () => {
		if (shim.mobilePlatform() === 'web') {
			// Directory picker IDs can't include certain characters.
			const pickerId = `setting-${settingId}`.replace(/[^a-zA-Z]/g, '_');
			const handle = await self.showDirectoryPicker({ id: pickerId, mode: props.mode });
			const fsDriver = shim.fsDriver() as FsDriverWeb;
			const uri = await fsDriver.mountExternalDirectory(handle, pickerId, props.mode);
			await props.updateSettingValue(settingId, uri);
			setFileSystemPath(uri);
		} else {
			try {
				const doc = await openDocumentTree(true);
				if (doc?.uri) {
					setFileSystemPath(doc.uri);
					await props.updateSettingValue(settingId, doc.uri);
				} else {
					throw new Error('User cancelled operation');
				}
			} catch (e) {
				reg.logger().info('Didn\'t pick sync dir: ', e);
			}
		}
	}, [props.updateSettingValue, settingId, props.mode]);

	const clearPathButtonPress = useCallback(() => {
		setFileSystemPath('');
		void props.updateSettingValue(settingId, '');
	}, [props.updateSettingValue, settingId]);

	// Supported on Android and some versions of Chrome
	const supported = shim.fsDriver().isUsingAndroidSAF() || (shim.mobilePlatform() === 'web' && 'showDirectoryPicker' in self);
	if (!supported) {
		return null;
	}

	const styleSheet = props.styles.styleSheet;

	const clearButton = (
		<IconButton
			iconName='material delete'
			description={_('Clear')}
			iconStyle={styleSheet.iconButtonText}
			contentWrapperStyle={styleSheet.iconButton}
			themeId={props.themeId}
			onPress={clearPathButtonPress}
		/>
	);

	return <View style={[styleSheet.settingContainer, styles.container]}>
		<TouchableRipple
			onPress={selectDirectoryButtonPress}
			style={styles.mainButton}
			role='button'
		>
			<View style={styles.buttonContent}>
				<Text key="label" style={styleSheet.settingText}>
					{props.settingMetadata.label()}
				</Text>
				<Text style={styleSheet.settingControl} numberOfLines={1}>
					{fileSystemPath}
				</Text>
			</View>
		</TouchableRipple>
		{fileSystemPath ? clearButton : null}
	</View>;
};

export default FileSystemPathSelector;
