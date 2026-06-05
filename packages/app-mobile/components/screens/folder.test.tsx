import * as React from 'react';
import { Store } from 'redux';
import { AppState } from '../../utils/types';
import TestProviderStack from '../testing/TestProviderStack';
import FolderScreen from './folder';
import Folder from '@joplin/lib/models/Folder';
import { setupDatabaseAndSynchronizer, switchClient } from '@joplin/lib/testing/test-utils';
import createMockReduxStore from '../../utils/testing/createMockReduxStore';
import setupGlobalStore from '../../utils/testing/setupGlobalStore';
import { act, fireEvent, render, screen, waitFor } from '../../utils/testing/testingLibrary';

let store: Store<AppState>;

const WrappedFolderScreen = () => {
	return <TestProviderStack store={store}>
		<FolderScreen/>
	</TestProviderStack>;
};

const selectFolder = (folderId: string) => {
	act(() => {
		store.dispatch({ type: 'NAV_GO', routeName: 'Folder', folderId });
	});
};

describe('folder', () => {
	beforeEach(async () => {
		await setupDatabaseAndSynchronizer(0);
		await switchClient(0);

		store = createMockReduxStore();
		setupGlobalStore(store);
	});
	afterEach(() => {
		screen.unmount();
	});

	test('should load the selected folder for editing', async () => {
		const folder = await Folder.save({ title: 'My notebook' });
		selectFolder(folder.id);

		render(<WrappedFolderScreen/>);

		await waitFor(() => {
			expect(screen.getByDisplayValue('My notebook')).toBeVisible();
		});
	});

	test('should save title changes and navigate to the notes screen', async () => {
		const folder = await Folder.save({ title: 'Original title' });
		selectFolder(folder.id);

		render(<WrappedFolderScreen/>);

		const titleInput = await screen.findByDisplayValue('Original title');
		fireEvent.changeText(titleInput, 'Updated title');

		fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));

		await waitFor(async () => {
			const reloaded = await Folder.load(folder.id);
			expect(reloaded.title).toBe('Updated title');
		});
		expect(store.getState().selectedFolderId).toBe(folder.id);
	});
});
