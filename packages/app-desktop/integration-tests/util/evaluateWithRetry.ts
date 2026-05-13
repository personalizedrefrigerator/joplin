
import { ElectronApplication } from '@playwright/test';
import retryOnFailure from './retryOnFailure';

const evaluateWithRetry = async <ReturnType, Arg> (
	app: ElectronApplication,
	pageFunction: Parameters<typeof app.evaluate<ReturnType, Arg>>[0],
	arg: Arg,
) => {
	await retryOnFailure(async () => {
		return await app.evaluate(pageFunction, arg);
	}, { maxRetries: 3 });
};

export default evaluateWithRetry;
