import Logger from '@joplin/utils/Logger';
import { BaseQueue, JobWithData, WorkHandler } from '../types';

const logger = Logger.create('JobProcessor');

export default class JobProcessor {
	private queue: BaseQueue;
	private isRunning = false;
	private isActive = false;
	private checkInteval = 5000;
	private currentJob: JobWithData | null = null;
	private workHandler: WorkHandler;

	public constructor(queue: BaseQueue, workHandler: WorkHandler, checkInterval?: number) {
		this.queue = queue;
		this.workHandler = workHandler;
		this.checkInteval = checkInterval ?? 5000;
		logger.info('Created JobProcessor');
	}

	public async init() {
		if (this.isRunning) {
			logger.warn('Already running');
			return;
		}

		this.isRunning = true;
		await this.workHandler.init();
		this.scheduleCheckForJobs();
	}

	private scheduleCheckForJobs() {
		setInterval(async () => {
			if (this.isActive) return;
			this.isActive = true;
			await this.runOnce();
		}, this.checkInteval);
	}

	private async checkForJobs() {
		this.currentJob = await this.queue.fetch();

		if (this.currentJob === null) {
			this.isActive = false;
			return;
		}

		logger.info(`Processing job ${this.currentJob.id}`);
		const transcription = await this.workHandler.run(this.currentJob.data.filePath);
		await this.queue.complete(this.currentJob.id, { result: transcription });
	}

	public async runOnce() {
		try {
			await this.checkForJobs();
		} catch (error) {
			logger.error(`Error while processing job: ${this.currentJob?.id}`, error);
			const e = error as Error;
			if (this.currentJob) {
				await this.queue.fail(this.currentJob.id, e);
			}
		} finally {
			this.currentJob = null;
			this.isActive = false;
		}
	}

}
