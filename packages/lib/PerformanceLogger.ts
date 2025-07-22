import Logger from '@joplin/utils/Logger';
import { Second } from '@joplin/utils/time';

const formatTaskDuration = (durationMs: number) => {
	const round = (n: number) => Math.round(n * 100) / 100;
	if (durationMs < Second / 4) {
		return `${round(durationMs)}ms`;
	} else {
		return `${round(durationMs / Second)}s`;
	}
};

const hasPerformanceMarkApi = typeof performance.mark === 'function' && typeof performance.measure === 'function';

type LogCallback = (message: string)=> void;

export default class PerformanceLogger {
	// Since one of the performance logger's uses is profiling
	// startup code, it's useful to have a default log implementation
	// (for before the logger is initialized).
	private static logBuffer_: string[] = [];
	private static log_: LogCallback = message => {
		this.logBuffer_.push(message);
	};

	// Note: Must be called after
	public static initialize(logger: Logger) {
		this.log_ = (message) => logger.info(`PerformanceLogger: ${message}`);

		for (const item of this.logBuffer_) {
			this.log_(item);
		}
		this.logBuffer_ = [];
	}

	private lastLogTime_ = 0;
	public static create(prefix: string) {
		return new PerformanceLogger(prefix);
	}

	private constructor(private readonly prefix_: string) { }

	public mark(name: string) {
		name = `${this.prefix_}/${name}`;

		// If available, make it possible to inspect the performance mark from the F12
		// developer tools.
		if (hasPerformanceMarkApi) {
			performance.mark(name);
		}

		const now = performance.now();
		const timeDelta = now - this.lastLogTime_;
		this.lastLogTime_ = now;
		PerformanceLogger.log_(`${name}: Mark at ${formatTaskDuration(performance.now())}   +${formatTaskDuration(timeDelta)}`);
	}

	public async track<T>(name: string, task: ()=> Promise<T>): Promise<T> {
		const tracker = this.taskStart(name);
		try {
			return await task();
		} finally {
			tracker.onEnd();
		}
	}

	public taskStart(name: string) {
		name = `${this.prefix_}/${name}`;

		if (typeof performance.mark === 'function') {
			performance.mark(`${name}-start`);
		}

		const startTime = performance.now();
		PerformanceLogger.log_(`${name}: Start at ${formatTaskDuration(startTime)}`);

		const onEnd = () => {
			const now = performance.now();
			if (hasPerformanceMarkApi) {
				performance.mark(`${name}-end`);
				performance.measure(name, `${name}-start`, `${name}-end`);
			}

			PerformanceLogger.log_(`${name}: End at ${formatTaskDuration(now)} (+${formatTaskDuration(now - startTime)})`);
		};
		return {
			onEnd,
			[Symbol.dispose]: onEnd,
		};
	}
}
