import ActionTracker from './ActionTracker';
import Client from './Client';
import { CleanupTask, FuzzContext } from './types';

export default class ClientPool {
	public static async create(
		context: FuzzContext,
		clientCount: number,
		addCleanupTask: (task: CleanupTask)=> void,
	) {
		const actionTracker = new ActionTracker();
		const clientPool: Client[] = [];
		for (let i = 0; i < clientCount; i++) {
			const client = await Client.create(actionTracker, context);
			addCleanupTask(() => client.close());
			clientPool.push(client);
		}

		return new ClientPool(clientPool);
	}
	public constructor(
		public readonly clients: Client[],
	) { }

	public randomClient() {
		return this.clients[Math.floor(Math.random() * this.clients.length)];
	}

	public async checkState() {
		for (const client of this.clients) {
			await client.checkState(this.clients);
		}
	}

	public async syncAll() {
		for (const client of this.clients) {
			await client.sync();
		}
	}
}

