import { itemDiffFields } from '../constants';
import { FolderItem } from '../types';
import keysMatch from './keysMatch';

const normalizeItem = (item: FolderItem) => {
	item = { ...item };
	if ('icon' in item && !item.icon) {
		delete item.icon;
	}
	return item;
};

const itemsMatch = (a: FolderItem, b: FolderItem) => {
	return keysMatch(normalizeItem(a), normalizeItem(b), itemDiffFields);
};

export default itemsMatch;
