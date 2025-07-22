import Logger from '@joplin/utils/Logger';
import { Second } from '@joplin/utils/time';

interface PerfStartMarker {
	name: string;
	time: number;
}

const logger = Logger.create('PerformanceLogger');
let lastLogTime = 0;

const formatTaskDuration = (durationMs: number) => {
	if (durationMs < Second / 4) {
		return `${durationMs}ms`;
	} else {
		const round = (n: number) => Math.floor(n * 100) / 100;
		return `${round(durationMs / Second)}s`;
	}
};

export default class PerformanceLogger {
	public static create(prefix: string) {
		return new PerformanceLogger(prefix);
	}

	private constructor(private readonly prefix_: string) { }

	public mark(name: string) {
		name = `${this.prefix_}/${name}`;

		const now = performance.now();
		const timeDelta = now - lastLogTime;
		lastLogTime = now;
		logger.info(`Mark: ${name} at ${formatTaskDuration(performance.now())}   +${formatTaskDuration(timeDelta)}`);
	}

	public taskStart(name: string) {
		name = `${this.prefix_}/${name}`;

		if (typeof performance.mark === 'function') {
			performance.mark(name);
		}

		logger.info(`Start: ${name} at ${formatTaskDuration(performance.now())}`);
		return { name, time: performance.now() };
	}

	public taskEnd(marker: PerfStartMarker) {
		const now = performance.now();
		if (typeof performance.measure === 'function') {
			const endName = `${marker.name}-end`;
			performance.mark(endName);
			performance.measure(`${marker.name}-duration`, marker.name, endName);
		}

		logger.info(`Completed: ${marker.name} at ${formatTaskDuration(now)} (+${formatTaskDuration(now - marker.time)})`);
	}
}
