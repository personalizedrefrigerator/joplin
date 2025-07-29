import { User } from '../../services/database/types';
import { bodyFields } from '../../utils/requestUtils';
import { SubPath } from '../../utils/routeUtils';
import Router from '../../utils/Router';
import { RouteType } from '../../utils/types';
import { AppContext } from '../../utils/types';
import { ErrorNotFound } from '../../utils/errors';
import { AclAction } from '../../models/BaseModel';
import { uuidgen } from '@joplin/lib/uuid';

const router = new Router(RouteType.Api);

async function fetchUser(path: SubPath, ctx: AppContext): Promise<User> {
	const user = await ctx.joplin.models.user().load(path.id);
	if (!user) throw new ErrorNotFound(`No user with ID ${path.id}`);
	return user;
}

async function postedUserFromContext(ctx: AppContext): Promise<User> {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
	return ctx.joplin.models.user().fromApiInput(await bodyFields<any>(ctx.req));
}

router.get('api/users/:id', async (path: SubPath, ctx: AppContext) => {
	const user = await fetchUser(path, ctx);
	await ctx.joplin.models.user().checkIfAllowed(ctx.joplin.owner, AclAction.Read, user);
	return user;
});

router.publicSchemas.push('api/users/:id/public_key');

// "id" in this case is actually the email address
// @deprecated - use api/users/:id/public_keys.
router.get('api/users/:id/public_key', async (path: SubPath, ctx: AppContext) => {
	const user = await ctx.joplin.models.user().loadByEmail(path.id);
	if (!user) return ''; // Don't throw an error to prevent polling the end point

	const ppk = await ctx.joplin.models.user().publicPrivateKey(user.id);
	if (!ppk) return '';
	if (typeof ppk !== 'object') return '';

	return {
		id: ppk.id,
		algorithm: ppk.algorithm,
		publicKey: ppk.publicKey,
	};
});

router.publicSchemas.push('api/users/:id/public_keys');
router.get('api/users/:id/public_keys', async (path: SubPath, ctx: AppContext) => {
	const email = path.id;
	const user = await ctx.joplin.models.user().loadByEmail(email);
	if (!user) return ''; // Don't throw an error to prevent polling the end point

	const ppks = await ctx.joplin.models.user().publicPrivateKeys(user.id);
	if (!ppks || typeof ppks !== 'object') return '';

	const result = [];
	for (const value of Object.values(ppks)) {
		// Public-private keys are supplied by the user -- do extra validation
		// to ensure that accessing properties on value won't cause an error.
		if (typeof value !== 'object') return '';

		result.push({
			id: value.id,
			algorithm: value.algorithm,
			publicKey: value.publicKey,
		});
	}

	return {
		items: result,
		has_more: false,
	};
});

router.post('api/users', async (_path: SubPath, ctx: AppContext) => {
	await ctx.joplin.models.user().checkIfAllowed(ctx.joplin.owner, AclAction.Create);
	const user = await postedUserFromContext(ctx);

	// We set a random password because it's required, but user will have to
	// set it after clicking on the confirmation link.
	user.password = uuidgen();
	user.must_set_password = 1;
	user.email_confirmed = 0;
	const output = await ctx.joplin.models.user().save(user);
	return ctx.joplin.models.user().toApiOutput(output);
});

router.get('api/users', async (_path: SubPath, ctx: AppContext) => {
	await ctx.joplin.models.user().checkIfAllowed(ctx.joplin.owner, AclAction.List);

	return {
		items: await ctx.joplin.models.user().all(),
		has_more: false,
	};
});

router.del('api/users/:id', async (path: SubPath, ctx: AppContext) => {
	const user = await fetchUser(path, ctx);
	await ctx.joplin.models.user().checkIfAllowed(ctx.joplin.owner, AclAction.Delete, user);
	await ctx.joplin.models.user().delete(user.id);
});

router.patch('api/users/:id', async (path: SubPath, ctx: AppContext) => {
	const user = await fetchUser(path, ctx);
	const postedUser = {
		...await postedUserFromContext(ctx),
		id: user.id,
	};
	await ctx.joplin.models.user().checkIfAllowed(ctx.joplin.owner, AclAction.Update, postedUser);
	await ctx.joplin.models.user().save({ id: user.id, ...postedUser });
});

export default router;
