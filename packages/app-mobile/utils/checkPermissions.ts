import { _ } from '@joplin/lib/locale';
import Logger from '@joplin/utils/Logger';

import { Platform, PermissionsAndroid, Permission } from 'react-native';
const logger = Logger.create('checkPermissions');

type rationale = {
	title: string;
	message: string;
	buttonPositive?: string;
	buttonNegative?: string;
	buttonNeutral?: string;
};

export default async (permissions: Permission, rationale?: rationale) => {
	// On iOS, permissions are prompted for by the system, so here we assume it's granted.
	if (Platform.OS !== 'android') return PermissionsAndroid.RESULTS.GRANTED;

	const granted = await PermissionsAndroid.check(permissions);
	logger.info('Checked permission:', granted);
	if (granted) {
		return PermissionsAndroid.RESULTS.GRANTED;
	} else {
		const result = await PermissionsAndroid.request(permissions, {
			buttonPositive: _('Ok'),
			...rationale,
		});
		logger.info('Requested permission:', result);
		return result;
	}
};
