import { FolderItem } from '../types';

// This applies keyof to each possible value of the given union.
// See https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types
// This is useful because ItemType is often a union.
type UnionKeys<T> = T extends object ? keyof T : never;

const keysMatch = <ItemType extends object = FolderItem> (
	localItem: ItemType,
	remoteItem: ItemType,
	keys: UnionKeys<ItemType>[],
) => {
	for (const key of keys) {
		if (key in localItem !== key in remoteItem) {
			return false;
		}
		if (key in localItem && localItem[key as keyof typeof localItem] !== remoteItem[key as keyof typeof remoteItem]) {
			return false;
		}
	}
	return true;
};

export default keysMatch;
