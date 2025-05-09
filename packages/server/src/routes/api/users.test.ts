import { User } from '../../services/database/types';
import { deleteApi, getApi, patchApi, postApi } from '../../utils/testing/apiUtils';
import { beforeAllDb, afterAllTests, beforeEachDb, createUserAndSession, models, expectHttpError } from '../../utils/testing/testUtils';
import { ErrorForbidden } from '../../utils/errors';

describe('api/users', () => {

	beforeAll(async () => {
		await beforeAllDb('api_users');
	});

	afterAll(async () => {
		await afterAllTests();
	});

	beforeEach(async () => {
		await beforeEachDb();
	});

	test('should create a user', async () => {
		const { session: adminSession } = await createUserAndSession(1, true);

		const userToSave: User = {
			full_name: 'Toto',
			email: 'toto@example.com',
			max_item_size: 1000,
			can_share_folder: 0,
		};

		await postApi(adminSession.id, 'users', userToSave);

		const savedUser = await models().user().loadByEmail('toto@example.com');
		expect(savedUser.full_name).toBe('Toto');
		expect(savedUser.email).toBe('toto@example.com');
		expect(savedUser.can_share_folder).toBe(0);
		expect(savedUser.max_item_size).toBe(1000);
		expect(savedUser.email_confirmed).toBe(0);
		expect(savedUser.must_set_password).toBe(1);
	});

	test('should patch a user', async () => {
		const { session: adminSession } = await createUserAndSession(1, true);
		const { user } = await createUserAndSession(2);

		await patchApi(adminSession.id, `users/${user.id}`, {
			max_item_size: 1000,
		});

		const savedUser = await models().user().load(user.id);
		expect(savedUser.max_item_size).toBe(1000);
	});

	test('should get a user', async () => {
		const { session: adminSession } = await createUserAndSession(1, true);
		const { user } = await createUserAndSession(2);

		const fetchedUser: User = await getApi(adminSession.id, `users/${user.id}`);

		expect(fetchedUser.id).toBe(user.id);
		expect(fetchedUser.email).toBe(user.email);
	});

	test('should delete a user', async () => {
		const { session: adminSession } = await createUserAndSession(1, true);
		const { user } = await createUserAndSession(2);

		await deleteApi(adminSession.id, `users/${user.id}`);

		const loadedUser = await models().user().load(user.id);
		expect(loadedUser).toBeFalsy();
	});

	test('should list users', async () => {
		const { session: adminSession } = await createUserAndSession(1, true);
		await createUserAndSession(2);
		await createUserAndSession(3);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Old code before rule was applied
		const results: any = await getApi(adminSession.id, 'users');
		expect(results.items.length).toBe(3);
	});

	test('should not allow changing non-whitelisted properties', async () => {
		const { session, user } = await createUserAndSession(1, false);
		expect(user.is_admin).toBe(0);

		await expectHttpError(async () => patchApi(session.id, `users/${user.id}`, {
			is_admin: 1,
		}), ErrorForbidden.httpCode);

		const reloadedUser = await models().user().load(user.id);
		expect(reloadedUser.is_admin).toBe(0);
	});

	test('should allow changing whitelisted properties', async () => {
		const { session, user } = await createUserAndSession(1, false);
		expect(user.is_admin).toBe(0);

		await patchApi(session.id, `users/${user.id}`, {
			full_name: 'New Name',
		});

		const reloadedUser = await models().user().load(user.id);
		expect(reloadedUser.full_name).toBe('New Name');
	});

});
