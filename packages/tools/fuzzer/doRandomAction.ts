import uuid from '@joplin/lib/uuid';
import retryWithCount from './utils/retryWithCount';
import Client from './Client';
import { strict as assert } from 'assert';
import { Second } from '@joplin/utils/time';
import { FuzzContext } from './types';
import ClientPool from './ClientPool';
import Logger from '@joplin/utils/Logger';
import Server from './Server';

const logger = Logger.create('doRandomAction');

type Action = ()=> Promise<void>;
type ResolveActionResult = false|Action;
type ActionMap = {
	[key: string]: ()=> ResolveActionResult|Promise<ResolveActionResult>;
};

const buildActions = (context: FuzzContext, client: Client, clientPool: ClientPool) => {
	const selectOrCreateParentFolder = async () => {
		let parentId = (await client.randomFolder({ includeReadOnly: false }))?.id;

		// Create a toplevel folder to serve as this
		// folder's parent if none exist yet
		if (!parentId) {
			parentId = uuid.create();
			await client.createFolder({
				parentId: '',
				id: parentId,
				title: 'Parent folder',
			});
		}

		return parentId;
	};

	const selectOrCreateWriteableNote = async () => {
		const options = { includeReadOnly: false };
		let note = await client.randomNote(options);

		if (!note) {
			await client.createNote({
				parentId: await selectOrCreateParentFolder(),
				id: uuid.create(),
				title: 'Test note',
				body: 'Body',
			});

			note = await client.randomNote(options);
			assert.ok(note, 'should have selected a random note');
		}

		return note;
	};

	const localActions: ActionMap = {
		newSubfolder: () => async () => {
			const folderId = uuid.create();
			const parentId = await selectOrCreateParentFolder();

			await client.createFolder({
				parentId: parentId,
				id: folderId,
				title: 'Subfolder',
			});
		},
		newToplevelFolder: () => async () => {
			const folderId = uuid.create();
			await client.createFolder({
				parentId: null,
				id: folderId,
				title: `Folder ${context.randInt(0, 1000)}`,
			});
		},
		newNote: () => async () => {
			const parentId = await selectOrCreateParentFolder();
			await client.createNote({
				parentId: parentId,
				title: `Test (x${context.randInt(0, 1000)})`,
				body: 'Testing...',
				id: uuid.create(),
			});
		},
		renameNote: () => async () => {
			const note = await selectOrCreateWriteableNote();

			await client.updateNote({
				...note,
				title: `Renamed (${context.randInt(0, 1000)})`,
			});
		},
		updateNoteBody: () => async () => {
			const note = await selectOrCreateWriteableNote();

			await client.updateNote({
				...note,
				body: `${note.body}\n\nUpdated.\n`,
			});
		},
		moveNote: async () => {
			const note = await client.randomNote({ includeReadOnly: false });
			if (!note) return false;

			const targetParent = await client.randomFolder({
				filter: folder => folder.id !== note.parentId,
				includeReadOnly: false,
			});
			if (!targetParent) return false;

			return async () => {
				await client.moveItem(note.id, targetParent.id);
			};
		},
		deleteNote: async () => {
			const target = await client.randomNote({ includeReadOnly: false });
			if (!target) return false;

			return async () => {
				await client.deleteNote(target.id);
			};
		},

		deleteFolder: async () => {
			const target = await client.randomFolder({ includeReadOnly: false });
			if (!target) return false;

			return async () => {
				await client.deleteFolder(target.id);
			};
		},
		moveFolderToToplevel: async () => {
			const target = await client.randomFolder({
				// Don't choose items that are already toplevel
				filter: item => !!item.parentId,
				includeReadOnly: false,
			});
			if (!target) return false;

			return async () => {
				await client.moveItem(target.id, '');
			};
		},
		moveFolderTo: async () => {
			const target = await client.randomFolder({
				// Don't move shared folders (should not be allowed by the GUI in the main apps).
				filter: item => !item.isRootSharedItem,
				includeReadOnly: false,
			});
			if (!target) return false;

			const targetDescendants = new Set(await client.allFolderDescendants(target.id));

			const newParent = await client.randomFolder({
				filter: (item) => {
					// Avoid making the folder a child of itself
					return !targetDescendants.has(item.id);
				},
				includeReadOnly: false,
			});
			if (!newParent) return false;

			return async () => {
				await client.moveItem(target.id, newParent.id);
			};
		},
	};

	const remoteActions: ActionMap = {
		shareFolder: async () => {
			const other = clientPool.randomClient(c => !c.hasSameAccount(client));
			if (!other) return false;

			const target = await client.randomFolder({
				filter: candidate => {
					const isToplevel = !candidate.parentId;
					const ownedByCurrent = candidate.ownedByEmail === client.email;
					const alreadyShared = isToplevel && candidate.isSharedWith(other.email);
					return isToplevel && ownedByCurrent && !alreadyShared;
				},
				includeReadOnly: true,
			});
			if (!target) return false;

			return async () => {
				const readOnly = context.randInt(0, 2) === 1 && context.isJoplinCloud;
				await client.shareFolder(target.id, other, { readOnly });
			};
		},
		unshareFolder: async () => {
			const target = await client.randomFolder({
				filter: candidate => {
					return candidate.isRootSharedItem && candidate.ownedByEmail === client.email;
				},
				includeReadOnly: true,
			});
			if (!target) return false;

			return async () => {
				const recipientIndex = context.randInt(-1, target.shareRecipients.length);
				if (recipientIndex === -1) { // Completely remove the share
					await client.deleteAssociatedShare(target.id);
				} else {
					const recipientEmail = target.shareRecipients[recipientIndex];
					const recipient = clientPool.clientsByEmail(recipientEmail)[0];
					assert.ok(recipient, `invalid state -- recipient ${recipientEmail} should exist`);
					await client.removeFromShare(target.id, recipient);
				}
			};
		},
		newClientOnSameAccount: () => async () => {
			const welcomeNoteCount = context.randInt(0, 30);
			logger.info(`Syncing a new client on the same account ${welcomeNoteCount > 0 ? `(with ${welcomeNoteCount} initial notes)` : ''}`);
			const createClientInitialNotes = async (client: Client) => {
				if (welcomeNoteCount === 0) return;

				// Create a new folder. Usually, new clients have a default set of
				// welcome notes when first syncing.
				const testNotesFolderId = uuid.create();
				await client.createFolder({
					id: testNotesFolderId,
					title: 'Test -- from secondary client',
					parentId: '',
				});

				for (let i = 0; i < welcomeNoteCount; i++) {
					await client.createNote({
						parentId: testNotesFolderId,
						id: uuid.create(),
						title: `Test note ${i}/${welcomeNoteCount}`,
						body: `Test note (in account ${client.email}), created ${Date.now()}.`,
					});
				}
			};

			await client.sync();

			const other = await clientPool.newWithSameAccount(client);
			await createClientInitialNotes(other);

			// Sometimes, a delay is needed between client creation
			// and initial sync. Retry the initial sync and the checkState
			// on failure:
			await retryWithCount(async () => {
				await other.sync();
				await other.checkState();
			}, {
				delayOnFailure: (count) => Second * count,
				count: 3,
				onFail: async (error) => {
					logger.warn('other.sync/other.checkState failed with', error, 'retrying...');
				},
			});

			await client.sync();
		},
		removeClientsOnSameAccount: async () => {
			const others = clientPool.othersWithSameAccount(client);
			if (others.length === 0) return false;

			return async () => {
				for (const otherClient of others) {
					assert.notEqual(otherClient, client);
					await otherClient.close();
				}
			};
		},
	};
	return { localActions, remoteActions };
};

const doRandomAction = async (context: FuzzContext, server: Server, client: Client, clientPool: ClientPool) => {
	const { localActions, remoteActions } = buildActions(context, client, clientPool);
	const allActions = { ...localActions, ...remoteActions };
	const actionKeys = Object.keys(allActions);

	const getRandomAction = async () => {
		let action: false|(()=> Promise<void>) = false;
		let key;
		while (!action) {
			const randomAction = actionKeys[context.randInt(0, actionKeys.length)];
			key = randomAction;
			action = await allActions[randomAction]();

			if (!action) {
				logger.debug('Skipped', action);
			}
		}
		return { key, action };
	};

	const { key, action } = await getRandomAction();
	logger.info(`Action: ${key} in ${client.email}`);

	let restoreEnvironment = () => Promise.resolve();
	const addServerInterference = key in remoteActions && context.randInt(0, 4) === 1;
	if (addServerInterference) {
		const serverInterferenceType = context.randInt(0, 2);
		if (serverInterferenceType === 0) {
			const serverIssueDelay = context.randInt(0, 20);
			const startDelay = context.randInt(0, Second);
			logger.info('Restarting the server in ', serverIssueDelay, 'ms');

			if (serverIssueDelay > 0) {
				setTimeout(() => {
					server.restart(startDelay);
				}, serverIssueDelay);
			} else {
				server.restart(startDelay);
			}
		} else {
			logger.info('Simulating server issues');

			await context.execApi('POST', 'api/debug', { action: 'simulateServerDown', enabled: 1 });
			restoreEnvironment = async () => {
				restoreEnvironment = () => Promise.resolve();
				await context.execApi('POST', 'api/debug', { action: 'simulateServerDown', enabled: 0 });
				logger.info('End server issue simulation');
			};

			setTimeout(() => restoreEnvironment(), context.randInt(0, Second * 3));
		}
	}

	await action();
	await restoreEnvironment();
};


export default doRandomAction;
