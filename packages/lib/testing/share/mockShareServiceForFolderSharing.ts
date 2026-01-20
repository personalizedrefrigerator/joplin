import { PublicPrivateKeyPair } from '../../services/e2ee/ppk/ppk';
import { ShareInvitation, ShareUserStatus } from '../../services/share/reducer';
import { ApiShare } from '../../services/share/ShareService';
import uuid from '../../uuid';
import { currentClientId } from '../test-utils';
import mockShareService, { ApiMock } from './mockShareService';
import { strict as assert } from 'node:assert';

class ShareRecord {
	private participants_: number[] = [];
	public constructor(public readonly state: ApiShare) {}

	public withParticipant(userId: number) {
		const result = new ShareRecord(this.state);
		result.participants_ = [...this.participants_, userId];
		return result;
	}

	public get participants() {
		return this.participants_;
	}

	public get owner() {
		return this.participants_[0];
	}
}

class InvitationRecord {
	public constructor(
		public readonly state: ShareInvitation,
		public readonly fromEmail: string,
		public readonly toEmail: string,
	) {}

	public withStatus(status: ShareUserStatus) {
		return new InvitationRecord({
			...this.state,
			status,
		}, this.fromEmail, this.toEmail);
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
	let shareInvitations: InvitationRecord[] = [];

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
			}).withParticipant(currentClientId());
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

			const clientId = emailToClientId(body.email);
			shares = shares.map(share => {
				if (share.state.id === shareId) {
					return share.withParticipant(clientId);
				} else {
					return share;
				}
			});

			const invitation = new InvitationRecord({
				can_read: 1,
				can_write: 1,
				id: uuid.create(),
				master_key: body.master_key,
				share: {
					type: 3, // Folder
					note_id: null,
					...share.state,
				},
				status: ShareUserStatus.Waiting,
			}, clientIdToEmail(share.owner), body.email);
			shareInvitations.push(invitation);

			return Promise.resolve({
				id: 'mock',
				share_id: share.state.id,
				user_id: `id-${clientId}`,
				status: ShareUserStatus.Waiting,
				masterKey: '',
			});
		},
		getShareUsers(shareId) {
			const share = shares.find(share => share.state.id === shareId);
			const participants = share.participants.map(clientId => {
				const email = clientIdToEmail(clientId);
				const invitation = shareInvitations.find(invitation => invitation.toEmail === email);
				return {
					id: `user-${clientId}`,
					status: invitation?.state?.status,
					user: {
						id: `user-${clientId}`,
						email,
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
			const clientEmail = clientIdToEmail(currentClientId());
			const items = shareInvitations
				.filter(invitation => invitation.toEmail === clientEmail)
				.map(item => item.state);

			return Promise.resolve({ items });
		},
		patchShareInvitations(invitationId, body) {
			const status = body.status as ShareUserStatus;
			shareInvitations = shareInvitations.map(invitation => {
				if (invitation.state.id === invitationId) {
					return invitation.withStatus(status);
				} else {
					return invitation;
				}
			});
			return Promise.resolve();
		},
		onRawRequest: options.onRawRequest,
	});

	return { service };
};

export default mockShareServiceForFolderSharing;
