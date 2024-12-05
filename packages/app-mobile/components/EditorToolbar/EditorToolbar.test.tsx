import * as React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';

import { Store } from 'redux';
import { AppState } from '../../utils/types';
import TestProviderStack from '../testing/TestProviderStack';
import EditorToolbar from './EditorToolbar';
import { setupDatabase, switchClient } from '@joplin/lib/testing/test-utils';
import createMockReduxStore from '../../utils/testing/createMockReduxStore';
import setGlobalStore from '../../utils/testing/setGlobalStore';
import Setting from '@joplin/lib/models/Setting';
import CommandService, { CommandRuntime, RegisteredRuntime } from '@joplin/lib/services/CommandService';
import allCommandNamesFromState from './utils/allCommandNamesFromState';

let store: Store<AppState>;

interface WrapperProps { }

const WrappedToolbar: React.FC<WrapperProps> = _props => {
	return <TestProviderStack store={store}>
		<EditorToolbar selectionState={null} />
	</TestProviderStack>;
};

const queryToolbarButton = (label: string) => {
	return screen.queryByRole('button', { name: label });
};

const openSettings = async () => {
	const settingButton = screen.getByRole('button', { name: 'Settings' });
	fireEvent.press(settingButton);
};

interface ToggleSettingItemProps {
	name: string;
	expectedInitialState: boolean;
}
const toggleSettingsItem = async (props: ToggleSettingItemProps) => {
	const initialChecked = props.expectedInitialState;
	const finalChecked = !props.expectedInitialState;

	const itemCheckbox = await screen.findByRole('checkbox', { name: props.name });
	expect(itemCheckbox).toBeVisible();
	expect(itemCheckbox).toHaveAccessibilityState({ checked: initialChecked });
	fireEvent.press(itemCheckbox);

	await waitFor(() => {
		expect(itemCheckbox).toHaveAccessibilityState({ checked: finalChecked });
	});
};

let mockCommands: RegisteredRuntime|null = null;
// The toolbar expects all toolbar command runtimes to be registered before it can be
// rendered:
const mockCommandRuntimes = (store: Store<AppState>) => {
	const makeMockRuntime = (commandName: string) => ({
		declaration: { name: commandName },
		runtime: (_props: null): CommandRuntime => ({
			execute: jest.fn(),
		}),
	});

	const isSeparator = (commandName: string) => commandName === '-';

	const mockRuntimes = allCommandNamesFromState(
		store.getState(),
	).filter(
		name => !isSeparator(name),
	).map(makeMockRuntime);
	return CommandService.instance().componentRegisterCommands(
		null, mockRuntimes,
	);
};

describe('EditorToolbar', () => {
	beforeEach(async () => {
		await setupDatabase(0);
		await switchClient(0);

		store = createMockReduxStore();
		setGlobalStore(store);
		mockCommands = mockCommandRuntimes(store);
	});

	afterEach(() => {
		mockCommands?.deregister();
		mockCommands = null;
	});

	it('unchecking items in settings should remove them from the toolbar', async () => {
		const toolbar = render(<WrappedToolbar/>);

		// The bold button should be visible by default (if this changes, switch this
		// test to a button that is present by default).
		const boldLabel = 'Bold';
		const boldButton = queryToolbarButton(boldLabel);
		expect(boldButton).toBeVisible();

		await openSettings();
		await toggleSettingsItem({ name: boldLabel, expectedInitialState: true });

		// Bold button should be removed from the toolbar
		await waitFor(() => {
			expect(queryToolbarButton(boldLabel)).toBe(null);
		});

		toolbar.unmount();
	});

	it('checking items in settings should add them to the toolbar', async () => {
		// Start with a mostly-empty toolbar for testing
		Setting.setValue('editor.toolbarButtons', ['textBold', 'textItalic']);

		const toolbar = render(<WrappedToolbar/>);

		// Initially, the button shouldn't be present in the toolbar.
		const commandLabel = 'Code';
		expect(queryToolbarButton(commandLabel)).toBeNull();

		await openSettings();
		await toggleSettingsItem({ name: commandLabel, expectedInitialState: false });

		// The button should now be added to the toolbar
		await waitFor(() => {
			expect(queryToolbarButton(commandLabel)).toBeVisible();
		});

		toolbar.unmount();
	});
});
