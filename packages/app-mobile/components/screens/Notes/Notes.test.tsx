import * as React from 'react';
import { Store } from 'redux';
import { AppState } from '../../../utils/types';
import NotesScreen from './Notes';
import Folder from '@joplin/lib/models/Folder';
import Note from '@joplin/lib/models/Note';
import NavService from '@joplin/lib/services/NavService';
import { setupDatabaseAndSynchronizer, switchClient } from '@joplin/lib/testing/test-utils';
import TestProviderStack from '../../testing/TestProviderStack';
import createMockReduxStore from '../../../utils/testing/createMockReduxStore';
import setupGlobalStore from '../../../utils/testing/setupGlobalStore';
import { render, screen, waitFor } from '../../../utils/testing/testingLibrary';

let store: Store<AppState>;

const Wrapped = () => {
	return <TestProviderStack store={store}>
		<NotesScreen visible={true}/>
	</TestProviderStack>;
};

const selectFolder = async (folderId: string) => {
	store.dispatch({ type: 'FOLDER_UPDATE_ALL', items: await Folder.all() });
	await NavService.go('Notes', { folderId });
};

describe('Notes', () => {
	beforeEach(async () => {
		await setupDatabaseAndSynchronizer(0);
		await switchClient(0);

		store = createMockReduxStore();
		setupGlobalStore(store);
	});
	afterEach(() => {
		screen.unmount();
	});

	test('should refresh and display the notes of the selected folder on mount', async () => {
		const folder = await Folder.save({ title: 'Test folder' });
		await Note.save({ title: 'First note', parent_id: folder.id });
		await selectFolder(folder.id);

		render(<Wrapped/>);

		await waitFor(() => {
			expect(screen.getByText('First note')).toBeVisible();
		});
	});

	test('should refresh when switching to a different folder', async () => {
		const folder1 = await Folder.save({ title: 'Folder 1' });
		await Note.save({ title: 'Note in folder 1', parent_id: folder1.id });
		const folder2 = await Folder.save({ title: 'Folder 2' });
		await Note.save({ title: 'Note in folder 2', parent_id: folder2.id });

		await selectFolder(folder1.id);
		render(<Wrapped/>);
		await waitFor(() => expect(screen.getByText('Note in folder 1')).toBeVisible());

		await selectFolder(folder2.id);
		await waitFor(() => expect(screen.getByText('Note in folder 2')).toBeVisible());
		expect(screen.queryByText('Note in folder 1')).toBeNull();
	});
});
