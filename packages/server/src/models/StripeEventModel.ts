import { StripeEvent, StripeEventStatus } from '../services/database/types';
import { ApiError, ErrorOptions } from '../utils/errors';
import BaseModel from './BaseModel';

export class ErrorTaskInProgress extends ApiError {
	public static httpCode = 409; // conflict
	public retryAfterMs = 0;

	public constructor(message = 'Task in progress', options: ErrorOptions = null) {
		super(message, ErrorTaskInProgress.httpCode, options);
		Object.setPrototypeOf(this, ErrorTaskInProgress.prototype);
	}
}

export default class StripeEventModel extends BaseModel<StripeEvent> {

	public get tableName(): string {
		return 'stripe_events';
	}

	protected hasUuid(): boolean {
		return true;
	}

	protected loadByTaskId(taskId: string): Promise<StripeEvent> {
		return this
			.db(this.tableName)
			.select(this.defaultFields)
			.where('stripe_id', '=', taskId)
			.first();
	}

	// Runs the given `task`. Rejects if the task is already in progress
	public async withTask(taskId: string, task: ()=> Promise<void>) {
		let taskRecord: StripeEvent;
		try {
			taskRecord = await this.save({
				stripe_id: taskId,
				status: StripeEventStatus.InProgress,
			}, { isNew: true });
		} catch (error) {
			// Due to a unique constraint on `stripe_id`, attempting to save a new status
			// for an existing task will fail.
			// This prevents multiple instances of the same task from running at the same time.
			throw new ErrorTaskInProgress(error.message);
		}

		try {
			await task();

			await this.save({
				id: taskRecord.id,
				status: StripeEventStatus.Success,
			});
		} catch (error) {
			await this.save({
				id: taskRecord.id,
				status: StripeEventStatus.Errored,
			});
		}
	}

	public async clearInProgressEvents() {
		await this.withTransaction(async () => {
			await this.db(this.tableName)
				.where('status', '=', StripeEventStatus.InProgress)
				.delete();
		}, 'StripeEventModel::clearInProgressEvents');
	}
}
