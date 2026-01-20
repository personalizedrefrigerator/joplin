import { PublicPrivateKeyPair } from '../../services/e2ee/ppk/ppk';
import { ShareUserStatus } from '../../services/share/reducer';
import { ApiShare } from '../../services/share/ShareService';
import { currentClientId } from '../test-utils';
import mockShareService, { ApiMock } from './mockShareService';
import { strict as assert } from 'node:assert';

class ShareRecord {
	private participants_: number[] = [];
	public constructor(public readonly state: ApiShare) {}
	public addUser(userId: number) {
		this.participants_.push(userId);
	}
	public get participants() {
		return this.participants_;
	}
}

interface ClientInfo {
	email: string;
	ppk?: PublicPrivateKeyPair;
}

interface Options {
	clientInfo: ClientInfo[];
	onRawRequest?: ApiMock['onRawRequest'];
}

const mockShareServiceForFolderSharing = (options: Options) => {

	const shareByFolderId = (folderId: string) => {
		return shares.find(share => share.state.folder_id === folderId);
	};

	const clientIdToEmail = (clientId: number) => {
		const email = options.clientInfo[clientId]?.email;
		if (!email) throw new Error(`No email registered for client: ${clientId}`);

		return email;
	};

	const emailToClientId = (email: string) => {
		const clientId = options.clientInfo.findIndex(client => client.email === email);
		if (clientId === -1) {
			throw new Error(`Unrecognized email: ${email}`);
		}
		return clientId;
	};

	let nextShareId = 1;
	let shares: ShareRecord[] = [];

	const service = mockShareService({
		getShares(_query) {
			const userShares = shares.filter(share => share.participants.includes(currentClientId()));
			return Promise.resolve({
				items: userShares.map(share => share.state),
			});
		},
		postShares(body) {
			const folderId = body.folder_id;
			assert.ok(typeof folderId === 'string', 'folder_id must be a string');
			const masterKeyId = body.master_key_id;
			assert.ok(typeof masterKeyId === 'string', 'master_key_id must be a string');

			// Return the existing share, if it exists. This is to match the behavior
			// of Joplin Server.
			const existingShare = shareByFolderId(folderId);
			if (existingShare) {
				return Promise.resolve(existingShare.state);
			}

			// Use a predictable ID:
			const id = `share_${nextShareId++}`;

			const share = new ShareRecord({
				id,
				master_key_id: masterKeyId,
				folder_id: folderId,
			});
			share.addUser(currentClientId());
			shares.push(share);

			return Promise.resolve(share.state);
		},
		deleteShare(shareId) {
			shares = shares.filter(share => share.state.id !== shareId);
			return Promise.resolve();
		},
		postShareUsers(shareId, body) {
			const share = shares.find(share => share.state.id === shareId);
			assert.ok(typeof body.email === 'string');
			share.addUser(emailToClientId(body.email));
			return Promise.resolve();
		},
		getShareUsers(shareId) {
			const share = shares.find(share => share.state.id === shareId);
			const participants = share.participants.map(clientId => {
				return {
					id: `user-${clientId}`,
					status: ShareUserStatus.Accepted,
					user: {
						id: `user-${clientId}`,
						email: clientIdToEmail(clientId),
					},
					can_read: 1,
					can_write: 1,
				};
			});
			return Promise.resolve({ items: participants });
		},
		getUserPublicKey(email) {
			const client = options.clientInfo.find(info => info.email === email);
			if (!client) {
				throw new Error(`Not found: Client with email: ${email}`);
			}
			return Promise.resolve(client.ppk);
		},
		getShareInvitations(_query) {
			return Promise.resolve({ items: [] });
		},
		patchShareInvitations(_query) {
			throw new Error('Not implemented: Patch share invitations');
		},
		onRawRequest: options.onRawRequest,
	});

	return { service };
};

export default mockShareServiceForFolderSharing;
