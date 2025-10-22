import { useRef } from 'react';
import { NativeModules } from 'react-native';
import Logger from '@joplin/utils/Logger';
import shim from '@joplin/lib/shim';
const logger = Logger.create('useClientSecret');

const { AppAuthModule } = NativeModules;
const useClientSecret = () => {
	const applicationClientSecret = useRef<Promise<string>>(null);
	applicationClientSecret.current ??= (async () => {
		if (!AppAuthModule) {
			logger.info('Skipping client secret check: Not supported on this device');
			return null;
		}

		try {
			const secret = await AppAuthModule.requestAppSecret();
			logger.info('Client secret:', secret ? 'found' : 'not found');
			return secret;
		} catch (error) {
			void shim.showErrorDialog(`An error occurred while fetching the device secret: ${error}`);
			logger.warn('Failed to fetch client secret:', error);

			return null;
		}
	})();
	return applicationClientSecret;
};

export default useClientSecret;
