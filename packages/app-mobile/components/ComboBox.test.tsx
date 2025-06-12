import * as React from 'react';
import { render, screen } from '@testing-library/react-native';
import createMockReduxStore from '../utils/testing/createMockReduxStore';
import TestProviderStack from './testing/TestProviderStack';
import ComboBox from './ComboBox';

interface Item { label: string }

interface WrapperProps {
	items: Item[];
	onItemSelected?: (item: Item)=> void;
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
		const testItems = [
			{ label: 'test 1' },
			{ label: 'test 2' },
			{ label: 'test 3' },
		];
		render(
			<WrappedComboBox
				items={testItems}
			/>,
		);

		expect(getSearchInput()).toHaveTextContent('');
		expect(getSearchResults()).toHaveLength(3);
	});
});
