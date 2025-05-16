import * as React from 'react';
import { Store } from 'redux';
import { AppState } from '../utils/types';
import TestProviderStack from './testing/TestProviderStack';
import { switchClient, setupDatabase, mockMobilePlatform } from '@joplin/lib/testing/test-utils';
import createMockReduxStore from '../utils/testing/createMockReduxStore';
import setupGlobalStore from '../utils/testing/setupGlobalStore';
import { render, screen } from '@testing-library/react-native';
import '@testing-library/jest-native/extend-expect';
import FeedbackBanner from './FeedbackBanner';

interface WrapperProps { }

let store: Store<AppState>;
const WrappedFeedbackBanner: React.FC<WrapperProps> = () => {
	return <TestProviderStack store={store}>
		<FeedbackBanner/>
	</TestProviderStack>;
};

describe('FeedbackBanner', () => {
	const resetMobilePlatform = ()=>{};

	beforeEach(async () => {
		await setupDatabase(0);
		await switchClient(0);

		store = createMockReduxStore();
		setupGlobalStore(store);

		jest.useFakeTimers({ advanceTimers: true });
		mockMobilePlatform('web');
	});

	afterEach(() => {
		screen.unmount();
		resetMobilePlatform();
	});

	test.each([
		{ platform: 'web', shouldShow: true },
		{ platform: 'ios', shouldShow: false },
	])('should correctly show/hide the feedback banner on %s', async ({ platform, shouldShow }) => {
		mockMobilePlatform(platform);

		const { unmount } = render(<WrappedFeedbackBanner />);

		const header = screen.queryByRole('header', { name: 'Feedback' });
		if (shouldShow) {
			expect(header).toBeVisible();
		} else {
			expect(header).toBeNull();
		}

		unmount();
	});
});
