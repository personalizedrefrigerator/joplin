import { EditorTheme } from '../../../types';
import addFormattingClasses from './addFormattingClasses';
import listIndentationExtension from './listIndentationExtension';
import replaceBulletLists from './replaceBulletLists';
import replaceCheckboxes from './replaceCheckboxes';
import replaceDividers from './replaceDividers';
import replaceFormatCharacters from './replaceFormatCharacters';

export default (theme: EditorTheme) => {
	return [
		replaceCheckboxes,
		replaceBulletLists,
		replaceFormatCharacters,
		listIndentationExtension(theme),
		replaceDividers,
		addFormattingClasses,
	];
};
