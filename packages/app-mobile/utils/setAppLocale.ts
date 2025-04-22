import Logger from '@joplin/utils/Logger';
import { NativeModules, Platform } from 'react-native';
const { AppLocaleModule } = NativeModules;

const logger = Logger.create('setAppLocale');

const setAppLocale = (locale: string) => {
	// Android and web expect language codes in the format es-ES, rather than
	// es_ES.
	locale = locale.replace(/_/g, '-');

	if (Platform.OS === 'web') {
		const htmlContainer = document.querySelector('html');
		htmlContainer.lang = locale;
	} else if (AppLocaleModule) {
		AppLocaleModule.setAppLocale(locale);
	} else {
		logger.warn('Setting the application locale is not supported on this platform.');
	}
};

export default setAppLocale;
