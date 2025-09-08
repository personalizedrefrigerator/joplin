import config from '../config';
import { ErrorServiceUnavailable } from '../utils/errors';
import { afterAllTests, beforeAllDb, beforeEachDb, createUserAndSession, expectHttpError, expectNoHttpError, koaAppContext, koaNext } from '../utils/testing/testUtils';
import { Env } from '../utils/types';
import debugHandler, { setSimulateUnavailable } from './debugHandler';

describe('debugHandler', () => {
	beforeAll(async () => {
		await beforeAllDb('debugHandler');
	});

	afterAll(async () => {
		await afterAllTests();
	});

	beforeEach(async () => {
		await beforeEachDb();
		setSimulateUnavailable(false);
	});

	it('should only be enabled in dev mode', async () => {
		const { session } = await createUserAndSession(1, true);
		const context = await koaAppContext({
			sessionId: session.id,
			request: {
				method: 'GET',
				url: '/login',
			},
		});
		setSimulateUnavailable(true);

		const originalEnv = config().env;
		try {
			// Should be enabled in dev mode
			config().env = Env.Dev;
			await expectHttpError(async () => {
				return debugHandler(context, koaNext);
			}, ErrorServiceUnavailable.httpCode);

			// ...but disabled in release mode
			config().env = Env.Prod;
			await expectNoHttpError(async () => {
				return debugHandler(context, koaNext);
			});
		} finally {
			config().env = originalEnv;
		}
	});
});
