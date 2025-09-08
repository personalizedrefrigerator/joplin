import { AppContext, Env, KoaNext } from '../utils/types';
import { ErrorServiceUnavailable } from '../utils/errors';
import Logger from '@joplin/utils/Logger';
import config from '../config';
const logger = Logger.create('debugHandler');

let simulatingServerFailure = false;
export const setSimulateUnavailable = (enabled: boolean) => {
	logger.info('Simulate service unavailable:', enabled);
	simulatingServerFailure = enabled;
};

export default async (ctx: AppContext, next: KoaNext) => {
	if (config().env !== Env.Dev) return next();

	if (simulatingServerFailure && !ctx.path.startsWith('/api/debug')) {
		throw new ErrorServiceUnavailable('Service Unavailable -- disabled as a part of automated testing');
	}
	return next();
};
