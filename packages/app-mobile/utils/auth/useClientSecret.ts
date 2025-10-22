import { useRef } from 'react';
import { NativeModules } from 'react-native';
import Logger from '@joplin/utils/Logger';
import shim from '@joplin/lib/shim';
const logger = Logger.create('useClientSecret');

interface ClientSecretProvider {
	// Accept the server URI in a callback, rather than as a prop. This helps prevent time-of-check to time-of-use
	// attacks in the case where the secret was last computed using old data.
	getForUri(serverUri: string): Promise<string|null>;
}

const { AppAuthModule } = NativeModules;
const useClientSecret = () => {
	const applicationClientSecret = useRef<ClientSecretProvider>(null);
	const cache = useRef<Map<string, string|null>>(new Map());
	applicationClientSecret.current ??= {
		getForUri: async (serverUri) => {
			// Looking up the client secret is potentially expensive and may be called several times in quick succession.
			// Cache if possible:
			if (cache.current.has(serverUri)) {
				return cache.current.get(serverUri);
			}

			const result = await (async () => {
				if (!AppAuthModule) {
					logger.info('Skipping client secret check: Not supported on this device');
					return null;
				}

				try {
					const secret = await AppAuthModule.requestAppSecret(serverUri);
					logger.info('Client secret:', secret ? 'found' : 'not found');
					return secret;
				} catch (error) {
					void shim.showErrorDialog(`An error occurred while fetching the device secret: ${error}`);
					logger.warn('Failed to fetch client secret:', error);

					return null;
				}
			})();

			cache.current.set(serverUri, result);
			return result;
		},
	};
	return applicationClientSecret;
};

export default useClientSecret;
