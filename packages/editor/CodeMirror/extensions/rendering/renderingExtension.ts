import addFormattingClasses from './addFormattingClasses';
import indentLists from './indentLists';
import replaceBackslashEscapes from './replaceBackslashEscapes';
import replaceBulletLists from './replaceBulletLists';
import replaceCheckboxes from './replaceCheckboxes';
import replaceDividers from './replaceDividers';
import replaceFormatCharacters from './replaceFormatCharacters';

export default () => {
	return [
		replaceCheckboxes,
		replaceBulletLists,
		replaceFormatCharacters,
		replaceBackslashEscapes,
		replaceDividers,
		addFormattingClasses,
		indentLists,
	];
};
