import { _ } from '@joplin/lib/locale';
import shim from '@joplin/lib/shim';
import Logger from '@joplin/utils/Logger';

import { Platform, PermissionsAndroid, Permission } from 'react-native';
const logger = Logger.create('checkPermissions');

type Rationale = {
	title: string;
	message: string;
	buttonPositive?: string;
	buttonNegative?: string;
	buttonNeutral?: string;
};

interface ConfirmMessage {
	title: string;
	message: string;
}

interface Options {
	rationale?: Rationale;
	confirmMessage?: ConfirmMessage;
}

export default async (permissions: Permission, { rationale, confirmMessage }: Options = {}) => {
	// On iOS, permissions are prompted for by the system, so here we assume it's granted.
	if (Platform.OS !== 'android') return PermissionsAndroid.RESULTS.GRANTED;

	const granted = await PermissionsAndroid.check(permissions);
	logger.info('Checked permission:', granted);
	if (granted) {
		return PermissionsAndroid.RESULTS.GRANTED;
	} else {
		if (confirmMessage && !await shim.showConfirmationDialog(confirmMessage.message, { title: confirmMessage.title })) {
			return PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN;
		}

		const result = await PermissionsAndroid.request(permissions, {
			buttonPositive: _('Ok'),
			...rationale,
		});
		logger.info('Requested permission:', result);
		return result;
	}
};
