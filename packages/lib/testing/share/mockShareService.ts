import { Store, createStore } from 'redux';
import reducer, { State, defaultState } from '../../reducer';
import ShareService from '../../services/share/ShareService';
import { encryptionService } from '../test-utils';
import JoplinServerApi, { ExecOptions } from '../../JoplinServerApi';
import { ShareInvitation, StateShare, StateShareUser } from '../../services/share/reducer';
import { PublicPrivateKeyPair } from '../../services/e2ee/ppk/ppk';

const testReducer = (state = defaultState, action: unknown) => {
	return reducer(state, action);
};

interface ShareStateResponse {
	items: Partial<StateShare>[];
}
interface ShareInvitationResponse {
	items: Partial<ShareInvitation>[];
}
interface ShareUsersResponse {
	items: Partial<StateShareUser>[];
}

type Json = Record<string, unknown>;
type ShareRecord = { id: string };

type OnApiExecListener = (
	method: string,
	path: string,
	query: Json,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Needs to interface with old code from before the rule was applied
	body: any,
	headers: Record<string, unknown>,
	options: ExecOptions
)=> Promise<unknown>;

interface PostShareUserResponse {
	id: string;
	share_id: string;
	user_id: string;
}

export type ApiMock = {
	getShares?: (query: Json)=> Promise<ShareStateResponse>;
	postShares?: (body: Json)=> Promise<ShareRecord>;
	getShareInvitations?: (query: Json)=> Promise<ShareInvitationResponse>;
	patchShareInvitations?: (shareUserId: string, body: Json)=> Promise<void>;
	getShareUsers?: (shareId: string)=> Promise<ShareUsersResponse>;
	postShareUsers?: (shareId: string, body: Json)=> Promise<PostShareUserResponse>;
	deleteShare?: (shareId: string)=> Promise<void>;
	patchShare?: (shareId: string, body: Json)=> Promise<void>;
	getUserPublicKey?: (userId: string)=> Promise<PublicPrivateKeyPair>;
	onUnhandled?: OnApiExecListener;

	onRawRequest?: (route: string, query: Json, body: Json)=> void;
};

// Initializes a share service with mocks
const mockShareService = (api: ApiMock, service?: ShareService, store?: Store<State>) => {
	service ??= new ShareService();

	const serverApi: Partial<JoplinServerApi> = {
		exec: (method, path = '', query = null, body = null, headers = null, options = null) => {
			const route = `${method} ${path}`;
			api.onRawRequest?.(route, query, body);

			if (route === 'GET api/shares') {
				return api.getShares(query);
			} else if (route === 'POST api/shares') {
				return api.postShares(body);
			} else if (route === 'GET api/share_users') {
				return api.getShareInvitations(query);
			} else if (route.startsWith('PATCH api/share_users/')) {
				const shareUserId = route.substring('PATCH api/share_users/'.length);
				return api.patchShareInvitations(shareUserId, body);
			}

			if (path.startsWith('api/shares/')) {
				const id = path.replace(/^api\/shares\//, '');

				if (method === 'DELETE') {
					return api.deleteShare(id);
				}

				if (method === 'PATCH') {
					return api.patchShare(id, body);
				}
			}

			const shareUsersMatch = path.match(/^api\/shares\/([^/]+)\/users$/);
			if (shareUsersMatch) {
				const shareId = shareUsersMatch[1];
				if (method === 'GET') {
					return api.getShareUsers(shareId);
				}
				if (method === 'POST') {
					return api.postShareUsers(shareId, body);
				}
			}

			const userPublicKeyMatch = path.match(/^api\/users\/([^/]+)\/public_key$/);
			if (userPublicKeyMatch) {
				const email = decodeURIComponent(userPublicKeyMatch[1]);
				if (method === 'GET') {
					return api.getUserPublicKey(email);
				}
			}

			if (api.onUnhandled) {
				return api.onUnhandled(method, path, query, body, headers, options);
			}
			return null;
		},
		personalizedUserContentBaseUrl(_userId) {
			return null;
		},
	};
	store ??= createStore(testReducer);
	service.initialize(store, encryptionService(), serverApi as JoplinServerApi);
	return service;
};
export default mockShareService;
