import { strict as assert } from 'assert';
import { ActionableClient, FolderMetadata, ItemId, NoteData, TreeItem, isFolder } from './types';
import type Client from './Client';

class ActionTracker {
	private idToItem_: Map<ItemId, TreeItem> = new Map();
	private tree_: Map<string, ItemId[]> = new Map();
	public constructor() {}

	private checkRep_() {
		const checkItem = (itemId: ItemId) => {
			assert.match(itemId, /^[a-zA-Z0-9]{32}$/, 'item IDs should be 32 character alphanumeric strings');

			const item = this.idToItem_.get(itemId);
			assert.ok(!!item, `should find item with ID ${itemId}`);

			if (item.parentId) {
				assert.ok(this.idToItem_.has(item.parentId), `should find parent (id: ${item.parentId})`);
			}

			if (isFolder(item)) {
				for (const childId of item.childIds) {
					checkItem(childId);
				}
			}
		};

		for (const childIds of this.tree_.values()) {
			for (const childId of childIds) {
				assert.ok(this.idToItem_.has(childId), `root item ${childId} should exist`);

				const item = this.idToItem_.get(childId);
				assert.ok(!!item);
				assert.equal(item.parentId, '', `${childId} should not have a parent`);

				checkItem(childId);
			}
		}
	}

	public track(client: { email: string }) {
		const clientId = client.email;
		this.tree_.set(clientId, []);

		const getChildIds = (itemId: ItemId) => {
			const item = this.idToItem_.get(itemId);
			if (!item || !isFolder(item)) return [];
			return item.childIds;
		};
		const updateChildren = (parentId: ItemId, updateFn: (oldChildren: ItemId[])=> ItemId[]) => {
			const parent = this.idToItem_.get(parentId);
			if (!parent) throw new Error(`Parent with ID ${parentId} not found.`);
			if (!isFolder(parent)) throw new Error(`Item ${parentId} is not a folder`);

			this.idToItem_.set(parentId, {
				...parent,
				childIds: updateFn(parent.childIds),
			});
		};
		const addRootItem = (itemId: ItemId) => {
			this.tree_.set(clientId, [...this.tree_.get(clientId), itemId]);
		};
		const removeRootItem = (itemId: ItemId) => {
			let removed = false;
			// Check each client -- if shared, a root item can be present in multiple
			// clients:
			for (const [clientId, previous] of this.tree_) {
				if (previous.includes(itemId)) {
					this.tree_.set(clientId, previous.filter(otherId => otherId !== itemId));
					removed = true;
				}
			}

			if (!removed) {
				throw new Error(`Not a root item: ${itemId}`);
			}
		};
		const addChild = (parentId: ItemId, childId: ItemId) => {
			updateChildren(parentId, (oldChildren) => {
				if (oldChildren.includes(childId)) return oldChildren;
				return [...oldChildren, childId];
			});
		};
		const removeChild = (parentId: ItemId, childId: ItemId) => {
			updateChildren(parentId, (oldChildren) => {
				return oldChildren.filter(otherId => otherId !== childId);
			});
		};
		const removeItemRecursive = (id: ItemId) => {
			const item = this.idToItem_.get(id);
			if (!item) throw new Error(`Item with ID ${id} not found.`);

			if (item.parentId) {
				removeChild(item.parentId, item.id);
			} else {

				removeRootItem(item.id);
			}

			if (isFolder(item)) {
				for (const childId of item.childIds) {
					const child = this.idToItem_.get(childId);
					assert.equal(child?.parentId, id, `child ${childId} should have accurate parent ID`);

					removeItemRecursive(childId);
				}
			}

			this.idToItem_.delete(id);
		};
		const mapItems = <T> (map: (item: TreeItem)=> T) => {
			const workList: ItemId[] = [...this.tree_.get(clientId)];
			const result: T[] = [];

			while (workList.length > 0) {
				const id = workList.pop();
				const item = this.idToItem_.get(id);
				if (!item) throw new Error(`Not found: ${id}`);

				result.push(map(item));

				if (isFolder(item)) {
					for (const childId of item.childIds) {
						workList.push(childId);
					}
				}
			}

			return result;
		};

		const tracker: ActionableClient = {
			createNote: (data: NoteData) => {
				this.idToItem_.set(data.id, {
					...data,
				});
				assert.ok(!!data.parentId, `note ${data.id} should have a parentId`);
				addChild(data.parentId, data.id);

				this.checkRep_();
				return Promise.resolve();
			},
			createFolder: (data: FolderMetadata) => {
				this.idToItem_.set(data.id, {
					...data,
					parentId: data.parentId ?? '',
					childIds: getChildIds(data.id),
				});
				if (data.parentId) {
					addChild(data.parentId, data.id);
				} else {
					addRootItem(data.id);
				}

				this.checkRep_();
				return Promise.resolve();
			},
			deleteFolder: (id: ItemId) => {
				this.checkRep_();

				const item = this.idToItem_.get(id);
				if (!item) throw new Error(`Not found ${id}`);
				if (!isFolder(item)) throw new Error(`Not a folder ${id}`);

				removeItemRecursive(id);

				this.checkRep_();
				return Promise.resolve();
			},
			shareFolder: (id: ItemId, shareWith: Client) => {
				const otherFolders = this.tree_.get(shareWith.email);
				if (otherFolders.includes(id)) {
					throw new Error(`Folder ${id} already shared with ${shareWith.email}`);
				}
				this.tree_.set(shareWith.email, [...otherFolders, id]);

				this.checkRep_();
				return Promise.resolve();
			},
			sync: () => Promise.resolve(),
			listNotes: () => {
				const notes = mapItems(item => {
					return isFolder(item) ? null : item;
				}).filter(item => !!item);

				this.checkRep_();
				return Promise.resolve(notes);
			},
			listFolders: () => {
				const folders = mapItems((item): FolderMetadata => {
					return isFolder(item) ? {
						id: item.id,
						title: item.title,
						parentId: item.parentId,
					} : null;
				}).filter(item => !!item);

				this.checkRep_();
				return Promise.resolve(folders);
			},
		};
		return tracker;
	}
}

export default ActionTracker;
