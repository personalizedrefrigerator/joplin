import Folder, { FolderEntityWithChildren } from '@joplin/lib/models/Folder';
import { WindowControl } from './useWindowControl';
import { _ } from '@joplin/lib/locale';

interface FolderEntry {
	key: string;
	value: string;
	label: string;
	indentDepth: number;
}

type SetLike = {
	has(key: string): boolean;
};

interface Options {
	allowSelectNone: boolean;
	excludeIds: SetLike;
}

const showFolderPicker = async (control: WindowControl, { allowSelectNone, excludeIds }: Options) => {
	const folders = await Folder.sortFolderTree();
	const startFolders: FolderEntry[] = [];
	const maxDepth = 15;

	if (allowSelectNone) {
		startFolders.push({
			key: '',
			value: '',
			label: _('None'),
			indentDepth: 0,
		});
	}

	const addOptions = (folders: FolderEntityWithChildren[], depth: number) => {
		for (let i = 0; i < folders.length; i++) {
			const folder = folders[i];

			// For example, this can disallow making a folder a subfolder of itself.
			if (excludeIds.has(folder.id)) {
				continue;
			}

			startFolders.push({ key: folder.id, value: folder.id, label: folder.title, indentDepth: depth });
			if (folder.children) addOptions(folder.children, (depth + 1) < maxDepth ? depth + 1 : maxDepth);
		}
	};

	addOptions(folders, 0);

	const folderId = await control.showPrompt({
		label: _('Move to notebook:'),
		value: '',
		suggestions: startFolders,
	});
	return folderId;
};

export default showFolderPicker;
