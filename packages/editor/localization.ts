import localizationPatterns from './localizationPatterns';
const { sprintf } = require('sprintf-js');

export type Localizations = Record<string, string>;
const localizations: Localizations = Object.create(null);

// For mobile, using @joplin/lib/locale directly significantly
// increases bundle size (as of Nov 2024, 2 MB -> 5 MB).
//
// Instead, localized strings should be transferred to the editor library
// just before creating the editor.
export const _ = (pattern: string, ...formatArgs: (string|number)[]) => {
	const localizedPattern = localizations[pattern];
	if (localizedPattern !== undefined) {
		pattern = localizedPattern;
	}
	return sprintf(pattern, ...formatArgs);
};

type LocalizeNoFormat = (original: string)=> string;
export const makeLocalizations = (localizeNoFormat: LocalizeNoFormat) => {
	const result: Localizations = {};
	for (const key of localizationPatterns) {
		result[key] = localizeNoFormat(key);
	}
	return result;
};

export const setLocalizations = (newLocalizations: Localizations) => {
	for (const [key, translated] of Object.entries(newLocalizations)) {
		localizations[key] = translated;
	}
};

