import * as React from 'react';
import { Store } from 'redux';
import { AppState } from '../../utils/types';
import ScreenHeader from './index';
import Folder from '@joplin/lib/models/Folder';
import Note from '@joplin/lib/models/Note';
import NavService from '@joplin/lib/services/NavService';
import { setupDatabaseAndSynchronizer, switchClient } from '@joplin/lib/testing/test-utils';
import TestProviderStack from '../testing/TestProviderStack';
import createMockReduxStore from '../../utils/testing/createMockReduxStore';
import setupGlobalStore from '../../utils/testing/setupGlobalStore';
import { fireEvent, render, screen, waitFor } from '../../utils/testing/testingLibrary';

let store: Store<AppState>;

const noop = () => {};

interface WrapperProps {
	title?: string;
}

const Wrapped: React.FC<WrapperProps> = props => {
	return <TestProviderStack store={store}>
		<ScreenHeader
			title={props.title}
			showUndoButton={false}
			showRedoButton={false}
			onUndoButtonPress={noop}
			onRedoButtonPress={noop}
			onSaveButtonPress={noop}
		/>
	</TestProviderStack>;
};

describe('ScreenHeader', () => {
	beforeEach(async () => {
		await setupDatabaseAndSynchronizer(0);
		await switchClient(0);

		store = createMockReduxStore();
		setupGlobalStore(store);
	});
	afterEach(() => {
		screen.unmount();
	});

	test('should render the title', () => {
		render(<Wrapped title='My title'/>);
		expect(screen.getByText('My title')).toBeVisible();
	});

	test('should show selection actions while notes are selected', async () => {
		const folder = await Folder.save({ title: 'Test folder' });
		const note = await Note.save({ title: 'Test note', parent_id: folder.id });
		await NavService.go('Notes', { folderId: folder.id });
		store.dispatch({ type: 'NOTE_SELECTION_START', id: note.id });

		render(<Wrapped/>);

		expect(screen.getByRole('button', { name: 'Select all' })).toBeVisible();
		expect(screen.getByRole('button', { name: 'Delete' })).toBeVisible();
		expect(screen.getByRole('button', { name: 'Duplicate' })).toBeVisible();
	});

	test('should move selected notes to the trash when pressing Delete', async () => {
		const folder = await Folder.save({ title: 'Test folder' });
		const note = await Note.save({ title: 'Test note', parent_id: folder.id });
		await NavService.go('Notes', { folderId: folder.id });
		store.dispatch({ type: 'NOTE_SELECTION_START', id: note.id });

		render(<Wrapped/>);
		fireEvent.press(screen.getByRole('button', { name: 'Delete' }));

		await waitFor(async () => {
			expect((await Note.load(note.id)).deleted_time).toBeGreaterThan(0);
		});
		expect(store.getState().noteSelectionEnabled).toBe(false);
	});
});
