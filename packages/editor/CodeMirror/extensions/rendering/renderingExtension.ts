import addFormattingClasses from './addFormattingClasses';
import replaceBackslashEscapes from './replaceBackslashEscapes';
import replaceBulletLists from './replaceBulletLists';
import replaceCheckboxes from './replaceCheckboxes';
import replaceDividers from './replaceDividers';
import replaceFormatCharacters from './replaceFormatCharacters';
import replaceStyledSpans from './replaceStyledSpans';

export default () => {
	return [
		replaceCheckboxes,
		replaceBulletLists,
		replaceFormatCharacters,
		replaceBackslashEscapes,
		replaceDividers,
		addFormattingClasses,
		replaceStyledSpans,
	];
};
