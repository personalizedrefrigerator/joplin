import { CommandRuntime, CommandDeclaration, CommandContext } from '@joplin/lib/services/CommandService';
import { _ } from '@joplin/lib/locale';
import { CommandRuntimeProps } from '../types';
import { Platform } from 'react-native';
import pickDocument from '../../../../utils/pickDocument';
import { ImagePickerResponse, launchImageLibrary } from 'react-native-image-picker';
import Logger from '@joplin/utils/Logger';

const logger = Logger.create('attachFile');

export const declaration: CommandDeclaration = {
	name: 'attachFile',
	label: () => _('Attach file'),
	iconName: 'material attachment',
};

export const runtime = (props: CommandRuntimeProps): CommandRuntime => {
	const takePhoto = async () => {
		if (Platform.OS === 'web') {
			const response = await pickDocument({ multiple: true, preferCamera: true });
			for (const asset of response) {
				await props.attachFile(asset, 'image');
			}
		} else {
			props.setCameraVisible(true);
		}
	};
	const attachFile = async () => {
		const response = await pickDocument({ multiple: true });
		for (const asset of response) {
			await props.attachFile(asset, 'all');
		}
	};
	const attachPhoto = async () => {
		// the selection Limit should be specified. I think 200 is enough?
		const response: ImagePickerResponse = await launchImageLibrary({ mediaType: 'photo', includeBase64: false, selectionLimit: 200 });

		if (response.errorCode) {
			logger.warn('Got error from picker', response.errorCode);
			return;
		}

		if (response.didCancel) {
			logger.info('User cancelled picker');
			return;
		}

		for (const asset of response.assets) {
			await props.attachFile(asset, 'image');
		}
	};

	const showAttachMenu = async () => {
		props.hideKeyboard();

		const buttons = [];

		// On iOS, it will show "local files", which means certain files saved from the browser
		// and the iCloud files, but it doesn't include photos and images from the CameraRoll
		//
		// On Android, it will depend on the phone, but usually it will allow browsing all files and photos.
		buttons.push({ text: _('Attach file'), id: 'attachFile' });

		// Disabled on Android because it doesn't work due to permission issues, but enabled on iOS
		// because that's only way to browse photos from the camera roll.
		if (Platform.OS === 'ios') buttons.push({ text: _('Attach photo'), id: 'attachPhoto' });
		buttons.push({ text: _('Take photo'), id: 'takePhoto' });

		const buttonId = await props.dialogs.showMenu(_('Choose an option'), buttons);

		if (buttonId === 'takePhoto') await takePhoto();
		if (buttonId === 'attachFile') await attachFile();
		if (buttonId === 'attachPhoto') await attachPhoto();
	};

	return {
		execute: async (_context: CommandContext, filePath?: string) => {
			if (filePath) {
				await props.attachFile({ uri: filePath }, 'all');
			} else {
				await showAttachMenu();
			}
		},

		enabledCondition: '!noteIsReadOnly',
	};
};
