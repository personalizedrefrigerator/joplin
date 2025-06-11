import * as React from 'react';
import { render, screen } from '@testing-library/react-native';
import createMockReduxStore from '../utils/testing/createMockReduxStore';
import TestProviderStack from './testing/TestProviderStack';
import ComboBox from './ComboBox';

interface WrapperProps {
	items: string[];
	onItemSelected?: (item: string)=> void;
}

const store = createMockReduxStore();
const WrappedComboBox: React.FC<WrapperProps> = ({
	items,
	onItemSelected = jest.fn(),
}: WrapperProps) => {
	return <TestProviderStack store={store}>
		<ComboBox
			items={items}
			onItemSelected={onItemSelected}
			allowNewItems={false}
			placeholder={'Test combobox'}
		/>
	</TestProviderStack>;
};

const getSearchInput = () => {
	return screen.getByPlaceholderText('Test combobox');
};
const getSearchResults = () => {
	return screen.getAllByRole('menuitem');
};

describe('ComboBox', () => {
	test('should list all items when the search query is empty', () => {
		render(
			<WrappedComboBox
				items={['test 1', 'test 2', 'test 3']}
			/>,
		);

		expect(getSearchInput()).toHaveTextContent('');
		expect(getSearchResults()).toHaveLength(3);
	});
});
