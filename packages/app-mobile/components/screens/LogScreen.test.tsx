import * as React from 'react';
import { Store } from 'redux';
import { AppState } from '../../utils/types';
import LogScreen from './LogScreen';
import { reg } from '@joplin/lib/registry';
import Logger, { TargetType } from '@joplin/utils/Logger';
import Database from '@joplin/lib/database';
import { DatabaseDriverNode } from '@joplin/lib/database-driver-node';
import TestProviderStack from '../testing/TestProviderStack';
import createMockReduxStore from '../../utils/testing/createMockReduxStore';
import { fireEvent, render, screen, waitFor } from '../../utils/testing/testingLibrary';

let store: Store<AppState>;
let logDatabase: Database;
let originalLogger: Logger;

const Wrapped = () => {
	return <TestProviderStack store={store}>
		<LogScreen themeId={store.getState().settings.theme} navigation={{ state: {} }}/>
	</TestProviderStack>;
};

// The Logger writes to its database target without exposing a promise to await,
// so wait until the entries have actually been persisted.
const waitForLogCount = async (count: number) => {
	await waitFor(async () => {
		expect((await reg.logger().lastEntries(null)).length).toBe(count);
	});
};

describe('LogScreen', () => {
	beforeEach(async () => {
		logDatabase = new Database(new DatabaseDriverNode());
		await logDatabase.open({ name: ':memory:' });
		await logDatabase.exec(Logger.databaseCreateTableSql());

		const logger = new Logger();
		logger.addTarget(TargetType.Database, { database: logDatabase, source: 'test' });
		logger.setLevel(Logger.LEVEL_DEBUG);
		originalLogger = reg.logger();
		reg.setLogger(logger);

		store = createMockReduxStore();
	});
	afterEach(async () => {
		screen.unmount();
		reg.setLogger(originalLogger);
		await logDatabase.close();
	});

	test('should load and render log entries on mount', async () => {
		reg.logger().info('an info message');
		await waitForLogCount(1);

		render(<Wrapped/>);

		await waitFor(() => {
			expect(screen.getByText(/an info message/)).toBeVisible();
		});
	});

	test('should hide non-error entries when toggling "Errors only"', async () => {
		reg.logger().info('an info message');
		reg.logger().error('an error message');
		await waitForLogCount(2);

		render(<Wrapped/>);
		await waitFor(() => expect(screen.getByText(/an info message/)).toBeVisible());
		expect(screen.getByText(/an error message/)).toBeVisible();

		fireEvent.press(screen.getByText('Errors only'));

		await waitFor(() => expect(screen.queryByText(/an info message/)).toBeNull());
		expect(screen.getByText(/an error message/)).toBeVisible();
		expect(screen.getByText('Show all')).toBeVisible();
	});
});
