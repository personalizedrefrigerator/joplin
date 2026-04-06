import { useState, useEffect } from 'react';
import KeymapService, { KeymapItem } from '@joplin/lib/services/KeymapService';
import getLabel from './getLabel';

const keymapService = KeymapService.instance();

// This custom hook provides a synchronized snapshot of the keymap residing at KeymapService
// All the logic regarding altering and interacting with the keymap is isolated from the components

function allKeymapItems() {
	const output = keymapService.getKeymapItems().slice();

	output.sort((a: KeymapItem, b: KeymapItem) => {
		return getLabel(a.command).toLocaleLowerCase() < getLabel(b.command).toLocaleLowerCase() ? -1 : +1;
	});

	return output;
}

const updateAccelerator = (keymap: KeymapItem[], commandName: string, newAccelerator: string|null) => {
	return keymap
		.map(item => {
			if (item.command === commandName) {
				return {
					...item,
					accelerator: newAccelerator,
				};
			} else {
				return item;
			}
		});
};

const useKeymap = (): [
	KeymapItem[],
	Error,
	(keymapItems: KeymapItem[])=> void,
	(commandName: string, accelerator: string)=> void,
	(commandName: string)=> void,
] => {
	const [keymapItems, setKeymapItems] = useState<KeymapItem[]>(() => allKeymapItems());
	const [keymapError, setKeymapError] = useState<Error>(null);
	const [mustSave, setMustSave] = useState(false);

	const setAccelerator = (commandName: string, accelerator: string) => {
		setKeymapItems(prevKeymap => {
			return updateAccelerator(prevKeymap, commandName, accelerator || null);
		});

		setMustSave(true);
	};

	const resetAccelerator = (commandName: string) => {
		const defaultAccelerator = keymapService.getDefaultAccelerator(commandName);
		setKeymapItems(prevKeymap => {
			return updateAccelerator(prevKeymap, commandName, defaultAccelerator);
		});

		setMustSave(true);
	};

	const overrideKeymapItems = (customKeymapItems: KeymapItem[]) => {
		const oldKeymapItems = [...customKeymapItems];
		keymapService.resetKeymap(); // Start with a fresh keymap

		try {
			// First, try to update the in-memory keymap of KeymapService
			// This function will throw if there are any issues with the new custom keymap
			keymapService.overrideKeymap(customKeymapItems);
			// Then, update the state with the data from KeymapService
			// Side-effect: Changes will also be saved to the disk
			setKeymapItems(keymapService.getKeymapItems());
			setMustSave(true);
		} catch (error) {
			// oldKeymapItems includes even the unchanged keymap items
			// However, it is not an issue because the logic accounts for such scenarios
			keymapService.overrideKeymap(oldKeymapItems);
			throw error;
		}
	};

	useEffect(() => {
		if (!mustSave) return;

		setMustSave(false);

		async function saveKeymap() {
			try {
				keymapService.overrideKeymap(keymapItems);
				await keymapService.saveCustomKeymap();
				setKeymapError(null);
			} catch (error) {
				error.message = `Could not save file: ${error.message}`;
				setKeymapError(error);
			}
		}

		void saveKeymap();
	}, [keymapItems, mustSave]);

	return [keymapItems, keymapError, overrideKeymapItems, setAccelerator, resetAccelerator];
};

export default useKeymap;
