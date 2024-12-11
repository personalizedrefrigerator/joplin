import { Store } from 'redux';
import { State } from '../../reducer';
import Folder from '../../models/Folder';
import Note from '../../models/Note';
import Synchronizer from '../../Synchronizer';
import { createReduxStore, setupDatabaseAndSynchronizer, switchClient, synchronizer, synchronizerStart } from '../../testing/test-utils';

let appStoreClient2: Store<State>;
const getClient2SyncReport = () => {
	return appStoreClient2.getState().syncReport;
};

describe('Synchronizer.report', () => {

	beforeEach(async () => {
		await setupDatabaseAndSynchronizer(1);
		await setupDatabaseAndSynchronizer(2);
		await switchClient(1);

		appStoreClient2 = createReduxStore();
		synchronizer(2).dispatch = appStoreClient2.dispatch;
	});

	test('should list the different kinds of items that were deleted', async () => {
		const folder = await Folder.save({ title: 'Test folder' });
		await Note.save({ title: 'Note 1', parent_id: folder.id });
		const note2 = await Note.save({ title: 'Note 2' });

		// Ensure that client 2 creates the items
		await synchronizerStart();
		await switchClient(2);
		await synchronizerStart();

		await Note.delete(note2.id, { toTrash: false });
		await synchronizerStart();

		// Deleting a remote item: Should list item types
		expect(Synchronizer.reportToLines(getClient2SyncReport())[0]).toBe(
			'Deleted remote: 1 (notes).',
		);

		// Delete a remote folder
		await switchClient(1);
		await Folder.delete(folder.id);
		await synchronizerStart();
		await switchClient(2);

		// Deleting local items: Sync report should include type descriptions:
		await synchronizerStart();
		expect(Synchronizer.reportToLines(getClient2SyncReport())[0]).toBe(
			'Deleted local: 2 (notes, notebooks).',
		);
	});
});
