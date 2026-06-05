import * as React from 'react';
import { Store } from 'redux';
import { AppState } from '../utils/types';
import NoteList from './NoteList';
import TestProviderStack from './testing/TestProviderStack';
import createMockReduxStore from '../utils/testing/createMockReduxStore';
import { fireEvent, render, screen } from '../utils/testing/testingLibrary';

let store: Store<AppState>;

const Wrapped = () => {
	return <TestProviderStack store={store}>
		<NoteList/>
	</TestProviderStack>;
};

describe('NoteList', () => {
	beforeEach(() => {
		store = createMockReduxStore();
	});
	afterEach(() => {
		screen.unmount();
	});

	test('should show the create-notebook prompt when there are no notebooks', () => {
		render(<Wrapped/>);
		expect(screen.getByText('You currently have no notebooks.')).toBeVisible();
	});

	test('should dispatch a navigation action when pressing "Create a notebook"', () => {
		const dispatchSpy = jest.spyOn(store, 'dispatch');
		render(<Wrapped/>);

		fireEvent.press(screen.getByText('Create a notebook'));
		expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({
			type: 'NAV_GO',
			routeName: 'Folder',
			folderId: null,
		}));
	});
});
