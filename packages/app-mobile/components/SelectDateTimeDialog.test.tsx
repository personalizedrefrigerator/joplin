import * as React from 'react';
import { Store } from 'redux';
import { AppState } from '../utils/types';
import Setting from '@joplin/lib/models/Setting';
import SelectDateTimeDialog from './SelectDateTimeDialog';
import TestProviderStack from './testing/TestProviderStack';
import createMockReduxStore from '../utils/testing/createMockReduxStore';
import { fireEvent, render, screen } from '../utils/testing/testingLibrary';

const themeId = Setting.THEME_LIGHT;
let store: Store<AppState>;

interface WrapperProps {
	shown: boolean;
	date: Date | null;
	onAccept?: (date: Date | null)=> void;
	onReject?: ()=> void;
}

const Wrapped: React.FC<WrapperProps> = props => {
	return <TestProviderStack store={store}>
		<SelectDateTimeDialog themeId={themeId} {...props} />
	</TestProviderStack>;
};

describe('SelectDateTimeDialog', () => {
	beforeEach(() => {
		store = createMockReduxStore();
	});
	afterEach(() => {
		screen.unmount();
	});

	test('should render nothing when not shown', () => {
		render(<Wrapped shown={false} date={null} />);
		expect(screen.queryByText('Set alarm')).toBeNull();
	});

	test('should call onAccept with the current date when saving', () => {
		const date = new Date(2026, 0, 2, 3, 4);
		const onAccept = jest.fn();
		render(<Wrapped shown={true} date={date} onAccept={onAccept} />);

		fireEvent.press(screen.getByText('Save alarm'));
		expect(onAccept).toHaveBeenCalledWith(date);
	});

	test('should call onAccept with null when clearing', () => {
		const onAccept = jest.fn();
		render(<Wrapped shown={true} date={new Date()} onAccept={onAccept} />);

		fireEvent.press(screen.getByText('Clear alarm'));
		expect(onAccept).toHaveBeenCalledWith(null);
	});

	test('should call onReject when cancelling', () => {
		const onReject = jest.fn();
		render(<Wrapped shown={true} date={null} onReject={onReject} />);

		fireEvent.press(screen.getByText('Cancel'));
		expect(onReject).toHaveBeenCalled();
	});
});
