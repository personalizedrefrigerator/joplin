import * as React from 'react';
import { Store } from 'redux';
import { AppState } from '../../utils/types';
import DropboxLoginScreen from './dropbox-login';
import { reg } from '@joplin/lib/registry';
import { setupDatabaseAndSynchronizer, switchClient } from '@joplin/lib/testing/test-utils';
import TestProviderStack from '../testing/TestProviderStack';
import createMockReduxStore from '../../utils/testing/createMockReduxStore';
import { fireEvent, render, screen, waitFor } from '../../utils/testing/testingLibrary';

let store: Store<AppState>;

// The Dropbox API is an external OAuth/network boundary that can't run in a unit
// test, so stub the sync target's api(). loginUrl() is the only method these tests
// exercise, which is enough to drive the screen's host adapter.
const fakeApi = {
	loginUrl: () => 'https://login.example/auth',
	setAuthToken: jest.fn(),
	execAuthToken: jest.fn(),
};

const Wrapped = () => {
	return <TestProviderStack store={store}>
		<DropboxLoginScreen/>
	</TestProviderStack>;
};

describe('dropbox-login', () => {
	beforeEach(async () => {
		await setupDatabaseAndSynchronizer(0);
		await switchClient(0);

		store = createMockReduxStore();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- stubbed external sync target
		jest.spyOn(reg, 'syncTarget').mockReturnValue({ api: async () => fakeApi } as any);
	});
	afterEach(() => {
		screen.unmount();
		jest.restoreAllMocks();
	});

	test('should populate the login URL from the API on mount', async () => {
		render(<Wrapped/>);

		await waitFor(() => {
			expect(screen.getByText('https://login.example/auth')).toBeVisible();
		});
	});

	test('should reflect typed auth code in the input', async () => {
		render(<Wrapped/>);
		await waitFor(() => expect(screen.getByText('https://login.example/auth')).toBeVisible());

		const input = screen.getByPlaceholderText('Enter code here');
		fireEvent.changeText(input, 'my-auth-code');

		expect(screen.getByDisplayValue('my-auth-code')).toBeVisible();
	});
});
