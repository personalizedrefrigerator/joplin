import { msleep } from '@joplin/utils/time';

interface Options {
	count: number;
	delayOnFailure?: number;
	onFail: (error: Error)=> Promise<void>;
}

const retryWithCount = async (task: ()=> Promise<void>, { count, delayOnFailure = 0, onFail }: Options) => {
	let lastError: Error|null = null;
	for (let retry = 0; retry < count; retry ++) {
		try {
			return await task();
		} catch (error) {
			await onFail(error);
			lastError = error;

			const willRetry = retry + 1 < count;
			if (willRetry && delayOnFailure) {
				await msleep(delayOnFailure);
			}
		}
	}

	if (lastError) throw lastError;
};

export default retryWithCount;

