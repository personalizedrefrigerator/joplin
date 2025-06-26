import { strict as assert } from 'assert';
import { ActionableClient, FolderMetadata, FuzzContext, ItemId, NoteData, TreeItem, isFolder } from './types';
import type Client from './Client';

interface ClientData {
	childIds: ItemId[];
	// Shared folders belonging to the client
	sharedFolderIds: ItemId[];
}

class ActionTracker {
	private idToItem_: Map<ItemId, TreeItem> = new Map();
	private tree_: Map<string, ClientData> = new Map();
	public constructor(private readonly context_: FuzzContext) {}

	private checkRep_() {
		const checkItem = (itemId: ItemId) => {
			assert.match(itemId, /^[a-zA-Z0-9]{32}$/, 'item IDs should be 32 character alphanumeric strings');

			const item = this.idToItem_.get(itemId);
			assert.ok(!!item, `should find item with ID ${itemId}`);

			if (item.parentId) {
				const parent = this.idToItem_.get(item.parentId);
				assert.ok(parent, `should find parent (id: ${item.parentId})`);

				assert.ok(isFolder(parent), 'parent should be a folder');
				assert.ok(parent.childIds.includes(itemId), 'parent should include the current item in its children');
			}

			if (isFolder(item)) {
				for (const childId of item.childIds) {
					checkItem(childId);
				}

				assert.equal(
					item.childIds.length,
					[...new Set(item.childIds)].length,
					'child IDs should be unique',
				);
			}
		};

		for (const clientData of this.tree_.values()) {
			for (const childId of clientData.childIds) {
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
		this.tree_.set(clientId, {
			childIds: [],
			sharedFolderIds: [],
		});

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
			const clientData = this.tree_.get(clientId);
			this.tree_.set(clientId, {
				...clientData,
				childIds: [...clientData.childIds, itemId],
			});
		};
		const removeRootItem = (itemId: ItemId) => {

			const removeForClient = (clientId: string) => {
				const clientData = this.tree_.get(clientId);
				const childIds = clientData.childIds;

				if (childIds.includes(itemId)) {
					const newChildIds = childIds.filter(otherId => otherId !== itemId);
					this.tree_.set(clientId, {
						...clientData,
						childIds: newChildIds,
					});
					return true;
				}

				return false;
			};

			const hasBeenCompletelyRemoved = () => {
				for (const clientData of this.tree_.values()) {
					if (clientData.childIds.includes(itemId)) {
						return false;
					}
				}
				return true;
			};

			const isOwnedByThis = this.tree_.get(clientId).sharedFolderIds.includes(itemId);

			let removed = false;
			if (isOwnedByThis) { // Unshare
				for (const id of this.tree_.keys()) {
					const result = removeForClient(id);
					removed ||= result;
				}

				const clientData = this.tree_.get(clientId);
				this.tree_.set(clientId, {
					...clientData,
					sharedFolderIds: clientData.sharedFolderIds.filter(id => id !== itemId),
				});

				// At this point, the item shouldn't be a child of any clients:
				assert.ok(hasBeenCompletelyRemoved(), 'item should be removed from all clients');

				// The item is unshared and can be removed entirely
				this.idToItem_.delete(itemId);
			} else {
				// Otherwise, even if part of a share, removing the
				// notebook just leaves the share.
				removed = removeForClient(clientId);

				if (hasBeenCompletelyRemoved()) {
					this.idToItem_.delete(itemId);
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
				// The parent may already be removed
				if (this.idToItem_.has(item.parentId)) {
					removeChild(item.parentId, item.id);
				}

				this.idToItem_.delete(id);
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
		};
		const mapItems = <T> (map: (item: TreeItem)=> T) => {
			const workList: ItemId[] = [...this.tree_.get(clientId).childIds];
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
				const shareWithChildIds = this.tree_.get(shareWith.email).childIds;
				if (shareWithChildIds.includes(id)) {
					throw new Error(`Folder ${id} already shared with ${shareWith.email}`);
				}
				const sharerClient = this.tree_.get(clientId);
				if (!sharerClient.sharedFolderIds.includes(id)) {
					this.tree_.set(clientId, {
						...sharerClient,
						sharedFolderIds: [...sharerClient.sharedFolderIds, id],
					});
				}

				this.tree_.set(shareWith.email, {
					...this.tree_.get(shareWith.email),
					childIds: [...shareWithChildIds, id],
				});


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
			randomFolder: async (options) => {
				let folders = await tracker.listFolders();
				if (options.filter) {
					folders = folders.filter(options.filter);
				}

				const folderIndex = this.context_.randInt(0, folders.length);
				return folders.length ? folders[folderIndex] : null;
			},
		};
		return tracker;
	}
}

export default ActionTracker;
