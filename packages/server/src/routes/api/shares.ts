import { ErrorBadRequest, ErrorNotFound, ErrorUnprocessableEntity } from '../../utils/errors';
import { Share, ShareType, ShareUserStatus, User } from '../../services/database/types';
import { bodyFields, ownerRequired } from '../../utils/requestUtils';
import { SubPath } from '../../utils/routeUtils';
import Router from '../../utils/Router';
import { RouteType } from '../../utils/types';
import { AppContext } from '../../utils/types';
import { AclAction } from '../../models/BaseModel';
import { compareVersions } from 'compare-versions';
import Logger from '@joplin/utils/Logger';

const logger = Logger.create('api/shares');

interface ShareApiInput extends Share {
	folder_id?: string;
	note_id?: string;
	recursive?: number;
}

const router = new Router(RouteType.Api);

router.public = true;

router.post('api/shares', async (_path: SubPath, ctx: AppContext) => {
	ownerRequired(ctx);

	interface Fields {
		folder_id?: string;
		note_id?: string;
		master_key_id?: string;
		recursive?: number;
	}

	const shareModel = ctx.joplin.models.share();
	const fields = await bodyFields<Fields>(ctx.req);
	const shareInput: ShareApiInput = shareModel.fromApiInput(fields) as ShareApiInput;
	if (fields.folder_id) shareInput.folder_id = fields.folder_id;
	if (fields.note_id) shareInput.note_id = fields.note_id;
	if ('type' in fields) shareInput.type = Number(fields.type) as ShareType;
	const masterKeyId = fields.master_key_id || '';

	// - The API end point should only expose two ways of sharing:
	//     - By folder_id (JoplinRootFolder)
	//     - By note_id (Link)
	// - Additionally, the App method is available, but not exposed via the API.

	if (shareInput.folder_id) {
		if (shareInput.type === ShareType.PublishedFolder) {
			return ctx.joplin.models.share().sharePublishedFolder(ctx.joplin.owner, shareInput.folder_id);
		}

		return ctx.joplin.models.share().shareFolder(ctx.joplin.owner, shareInput.folder_id, masterKeyId);
	} else if (shareInput.note_id) {
		return ctx.joplin.models.share().shareNote(ctx.joplin.owner, shareInput.note_id, masterKeyId, fields.recursive === 1);
	} else {
		throw new ErrorBadRequest('Either folder_id or note_id must be provided');
	}
});

const increaseAppMinVersionInInfoJson = async (users: User[], appMinVersion: string, ctx: AppContext) => {
	const errors = [];
	for (const user of users) {
		try {
			const item = await ctx.joplin.models.item().loadByName(user.id, 'info.json', { withContent: true });
			const content = JSON.parse(item.content.toString('utf-8'));
			if (typeof content.appMinVersion === 'string' && compareVersions(content.appMinVersion, appMinVersion) < 0) {
				content.appMinVersion = appMinVersion;

				await ctx.joplin.models.item().saveFromRawContent(user, {
					name: 'info.json',
					body: Buffer.from(JSON.stringify(content, undefined, '\t'), 'utf-8'),
				});
			}
		} catch (error) {
			errors.push(error);
		}
	}

	if (errors.length) {
		logger.error('Failed to increase appMinVersion', errors);
		throw new ErrorUnprocessableEntity('Failed to update appMinVersion');
	}
};

router.patch('api/shares/:id', async (path: SubPath, ctx: AppContext) => {
	ownerRequired(ctx);

	interface UserInput {
		app_min_version: string;
	}

	const fields = await bodyFields(ctx.req) as UserInput;
	const appMinVersion = fields.app_min_version;
	if (!appMinVersion || !appMinVersion.match(/^\d{0,4}\.\d{0,4}\.\d{0,4}$/)) {
		throw new ErrorBadRequest('Invalid or missing app_min_version');
	}

	const shareId = path.id;

	const share = await ctx.joplin.models.share().load(shareId);
	if (!share) throw new ErrorNotFound();
	await ctx.joplin.models.share().checkIfAllowed(ctx.joplin.owner, AclAction.Update, share, ['app_min_version']);

	const shareUsers = await ctx.joplin.models.shareUser().byShareId(share.id, ShareUserStatus.Accepted);
	const userIds = shareUsers.map(u => u.user_id);
	const users = await ctx.joplin.models.user().loadByIds(userIds);

	// Users need to upgrade to either:
	// - A version of Joplin that supports separate min app versions on separate shares.
	// - The minimum version for this share.
	const minVersionSupportingShareVersions = '3.8.0';
	const newMinVersion = compareVersions(minVersionSupportingShareVersions, appMinVersion) < 0 ? minVersionSupportingShareVersions : appMinVersion;
	await increaseAppMinVersionInInfoJson(users, newMinVersion, ctx);

	await ctx.joplin.models.share().save({ id: share.id, app_min_version: appMinVersion });
});

router.post('api/shares/:id/users', async (path: SubPath, ctx: AppContext) => {
	ownerRequired(ctx);

	interface UserInput {
		email: string;
		master_key?: string;
	}

	const fields = await bodyFields(ctx.req) as UserInput;
	const user = await ctx.joplin.models.user().loadByEmail(fields.email);
	if (!user) throw new ErrorNotFound('User not found');

	const masterKey = fields.master_key || '';
	const shareId = path.id;

	await ctx.joplin.models.shareUser().checkIfAllowed(ctx.joplin.owner, AclAction.Create, {
		share_id: shareId,
		user_id: user.id,
		master_key: masterKey,
	});

	return ctx.joplin.models.shareUser().addByEmail(shareId, user.email, masterKey);
});

router.get('api/shares/:id/users', async (path: SubPath, ctx: AppContext) => {
	ownerRequired(ctx);

	const shareId = path.id;
	const share = await ctx.joplin.models.share().load(shareId);
	await ctx.joplin.models.share().checkIfAllowed(ctx.joplin.owner, AclAction.Read, share);

	const shareUsers = await ctx.joplin.models.shareUser().byShareId(shareId, null);
	const users = await ctx.joplin.models.user().loadByIds(shareUsers.map(su => su.user_id));

	const items = shareUsers.map(su => {
		const user = users.find(u => u.id === su.user_id);

		return {
			id: su.id,
			status: su.status,
			user: {
				id: user.id,
				email: user.email,
			},
		};
	});

	return {
		items,
		has_more: false,
	};
});

router.get('api/shares/:id', async (path: SubPath, ctx: AppContext) => {
	const shareModel = ctx.joplin.models.share();
	const share = await shareModel.load(path.id);

	if (share && (share.type === ShareType.Note || share.type === ShareType.PublishedFolder)) {
		// No authentication is necessary - anyone who knows the share ID is allowed
		// to access the file. It is essentially public.
		return shareModel.toApiOutput(share);
	}

	throw new ErrorNotFound();
});

// This end points returns both the shares owned by the user, and those they
// participate in.
router.get('api/shares', async (_path: SubPath, ctx: AppContext) => {
	ownerRequired(ctx);

	const ownedShares = (await ctx.joplin.models.share().toApiOutput(await ctx.joplin.models.share().sharesByUser(ctx.joplin.owner.id))) as Share[];
	const participatedShares = (await ctx.joplin.models.share().toApiOutput(await ctx.joplin.models.share().participatedSharesByUser(ctx.joplin.owner.id)));

	// Fake paginated results so that it can be added later on, if needed.
	return {
		items: ownedShares.concat(participatedShares).map(share => {
			return {
				...share,
				user: {
					id: share.owner_id,
				},
			};
		}),
		has_more: false,
	};
});

router.del('api/shares/:id', async (path: SubPath, ctx: AppContext) => {
	ownerRequired(ctx);

	const share = await ctx.joplin.models.share().load(path.id);
	await ctx.joplin.models.share().checkIfAllowed(ctx.joplin.owner, AclAction.Delete, share);
	await ctx.joplin.models.share().delete(share.id);
});

export default router;
