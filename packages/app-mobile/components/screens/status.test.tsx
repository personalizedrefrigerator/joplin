import * as React from 'react';
import { Store } from 'redux';
import { AppState } from '../../utils/types';
import StatusScreen from './status';
import Resource from '@joplin/lib/models/Resource';
import { setupDatabaseAndSynchronizer, switchClient } from '@joplin/lib/testing/test-utils';
import TestProviderStack from '../testing/TestProviderStack';
import createMockReduxStore from '../../utils/testing/createMockReduxStore';
import { fireEvent, render, screen, waitFor } from '../../utils/testing/testingLibrary';

let store: Store<AppState>;

const Wrapped = () => {
	return <TestProviderStack store={store}>
		<StatusScreen/>
	</TestProviderStack>;
};

describe('status', () => {
	beforeEach(async () => {
		await setupDatabaseAndSynchronizer(0);
		await switchClient(0);

		store = createMockReduxStore();
	});
	afterEach(() => {
		screen.unmount();
	});

	test('should load and render the report on mount', async () => {
		render(<Wrapped/>);

		await waitFor(() => {
			expect(screen.getByText('Attachments')).toBeVisible();
		});
		expect(screen.getByText('Created locally: 0')).toBeVisible();
	});

	test('should re-query the report when pressing Refresh', async () => {
		render(<Wrapped/>);
		await waitFor(() => expect(screen.getByText('Created locally: 0')).toBeVisible());

		// A locally-created resource should only be counted after refreshing.
		await Resource.save({ mime: 'text/plain', title: 'test-resource' });
		fireEvent.press(screen.getByText('Refresh'));

		await waitFor(() => expect(screen.getByText('Created locally: 1')).toBeVisible());
	});
});
